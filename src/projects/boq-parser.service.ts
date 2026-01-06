import { Injectable, BadRequestException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';

export interface BOQItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
  section?: string;
  subSection?: string;
  rowIndex: number;
  rawData: Record<string, any>;
  uncertainHeaders?: string[];
}

export interface BOQParseResult {
  items: BOQItem[];
  totalAmount: number;
  sections: string[];
  uncertainHeaders: string[];
  metadata: {
    totalRows: number;
    processedRows: number;
    skippedRows: number;
    fileType: string;
  };
}

@Injectable()
export class BoqParserService {
  /**
   * Parse BOQ file (CSV or Excel) with robust validation
   * Golden Rule: QTY + UNIT + DESCRIPTION = phase row
   */
  async parseBoqFile(
    file: Express.Multer.File,
    progressCallback?: (progress: { current: number; total: number; message: string }) => void,
  ): Promise<BOQParseResult> {
    const fileExtension = file.originalname
      .toLowerCase()
      .substring(file.originalname.lastIndexOf('.'));

    console.log(`[BOQ Parser] Processing file: ${file.originalname} (${fileExtension})`);

    if (fileExtension === '.csv') {
      return this.parseCsvFile(file, progressCallback);
    } else if (fileExtension === '.xlsx') {
      return this.parseExcelFile(file, progressCallback);
    } else if (fileExtension === '.xls') {
      throw new BadRequestException(
        `Legacy Excel format (.xls) is not supported. Please save your file as .xlsx (Excel 2007+) format.`,
      );
    } else {
      throw new BadRequestException(
        `Unsupported file type: ${fileExtension}. Please upload CSV (.csv) or Excel (.xlsx) files.`,
      );
    }
  }

  /**
   * STEP 1: Define what a "valid phase row" is
   * A row is a phase ONLY IF:
   * ✅ QTY exists and is a number > 0
   * ✅ UNIT exists and is a string
   * ✅ DESCRIPTION is not empty
   * ❌ It is NOT a section header
   */
  private isValidPhaseRow(row: any, rowIndex: number): boolean {
    const description = row.description?.toString().trim();
    const quantity = this.parseAmount(row.quantity);
    const unit = row.unit?.toString().trim();

    const isValid = !!(
      description &&
      description.length > 0 &&
      unit &&
      unit.length > 0 &&
      !isNaN(quantity) &&
      quantity > 0
    );

    if (!isValid) {
      console.log(`[BOQ Parser] Row ${rowIndex} skipped - Reason: ${
        !description ? 'No description' :
        !unit ? 'No unit' :
        isNaN(quantity) ? 'Invalid quantity' :
        quantity <= 0 ? 'Quantity is 0 or negative' :
        'Unknown'
      }`, {
        description: description?.substring(0, 50),
        quantity,
        unit,
      });
    }

    return isValid;
  }

  /**
   * STEP 2 & 3: Parse CSV with hard filtering
   */
  private async parseCsvFile(
    file: Express.Multer.File,
    progressCallback?: (progress: { current: number; total: number; message: string }) => void,
  ): Promise<BOQParseResult> {
    console.log('[BOQ Parser] Starting CSV parsing...');
    
    const csvContent = file.buffer.toString('utf-8');
    const allLines = csvContent.split(/\r?\n/).filter((line) => line.trim().length > 0);

    if (allLines.length < 2) {
      throw new BadRequestException('CSV file must have at least a header row and one data row');
    }

    // Fixed column order: Skip column 0, then Description(1), Quantity(2), Unit(3), Price(4), Total Amount(5)
    const COLUMN_INDEXES = {
      DESCRIPTION: 1,
      QUANTITY: 2,
      UNIT: 3,
      PRICE: 4,
      TOTAL_AMOUNT: 5,
    };

    const items: BOQItem[] = [];
    const sections = new Set<string>();
    const dataLines = allLines.slice(1); // Skip header row
    let currentSection: string | null = null;
    let skippedCount = 0;

    console.log(`[BOQ Parser] Total rows to process: ${dataLines.length}`);

    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i];
      const rowIndex = i + 2; // +2 for header and 0-index
      
      if (progressCallback && i % 10 === 0) {
        progressCallback({
          current: i + 1,
          total: dataLines.length,
          message: `Processing row ${i + 1} of ${dataLines.length}...`,
        });
      }

      const values = this.parseCsvLine(line);
      
      // Skip if not enough columns
      if (values.length < COLUMN_INDEXES.TOTAL_AMOUNT + 1) {
        skippedCount++;
        continue;
      }

      // Extract values using fixed column order
      const description = (values[COLUMN_INDEXES.DESCRIPTION] || '').toString().trim();
      const quantityStr = (values[COLUMN_INDEXES.QUANTITY] || '').toString().trim();
      const unit = (values[COLUMN_INDEXES.UNIT] || '').toString().trim();
      const priceStr = (values[COLUMN_INDEXES.PRICE] || '').toString().trim();
      const totalAmountStr = (values[COLUMN_INDEXES.TOTAL_AMOUNT] || '').toString().trim();

      // Normalize row data
      const normalizedRow = {
        description: description || null,
        quantity: quantityStr || null,
        unit: unit || null,
        price: priceStr || null,
        totalAmount: totalAmountStr || null,
      };

      // Parse numeric values
      const quantity = this.parseAmount(quantityStr);
      const rate = this.parseAmount(priceStr);
      let amount = this.parseAmount(totalAmountStr);

      // STEP 3: Check if this is a section header (has description but no QTY/UNIT)
      if (description && (!quantityStr || !unit || quantity === 0)) {
        // This is likely a section header
        currentSection = description;
        sections.add(description);
        console.log(`[BOQ Parser] Section detected: "${description}"`);
        skippedCount++;
        continue;
      }

      // STEP 1: Validate if this is a valid phase row
      if (!this.isValidPhaseRow(normalizedRow, rowIndex)) {
        skippedCount++;
        continue;
      }

      // Calculate amount if not provided
      if (amount === 0 && quantity > 0 && rate > 0) {
        amount = quantity * rate;
      }

      // STEP 4: Create validated BOQ item
      const item: BOQItem = {
        id: `boq-${rowIndex}`,
        description,
        quantity,
        unit,
        rate,
        amount,
        section: currentSection || undefined,
        rowIndex,
        rawData: {
          description,
          quantity: quantityStr,
          unit,
          price: priceStr,
          totalAmount: totalAmountStr,
        },
      };

      items.push(item);
      console.log(`[BOQ Parser] ✅ Row ${rowIndex} added: "${description.substring(0, 40)}" | Qty: ${quantity} | Unit: ${unit}`);
    }

    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

    console.log(`[BOQ Parser] CSV parsing complete:`, {
      totalRows: dataLines.length,
      validPhases: items.length,
      skipped: skippedCount,
      sections: Array.from(sections),
    });

    return {
      items,
      totalAmount,
      sections: Array.from(sections),
      uncertainHeaders: [],
      metadata: {
        totalRows: allLines.length,
        processedRows: items.length,
        skippedRows: skippedCount,
        fileType: 'CSV',
      },
    };
  }

  /**
   * STEP 2 & 3: Parse Excel with hard filtering and normalization
   */
  private async parseExcelFile(
    file: Express.Multer.File,
    progressCallback?: (progress: { current: number; total: number; message: string }) => void,
  ): Promise<BOQParseResult> {
    console.log('[BOQ Parser] Starting Excel parsing...');
    
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(file.buffer);

      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        throw new BadRequestException('Excel file must have at least one worksheet');
      }

      if (worksheet.rowCount < 2) {
        throw new BadRequestException('Excel file must have at least a header row and one data row');
      }

      // Fixed column order: Skip column A, then Description(B), Quantity(C), Unit(D), Price(E), Total Amount(F)
      const COLUMN_INDEXES = {
        DESCRIPTION: 2,  // Column B (1-indexed)
        QUANTITY: 3,     // Column C
        UNIT: 4,         // Column D
        PRICE: 5,        // Column E
        TOTAL_AMOUNT: 6, // Column F
      };

      const items: BOQItem[] = [];
      const sections = new Set<string>();
      const totalRows = worksheet.rowCount;
      let currentSection: string | null = null;
      let skippedCount = 0;

      console.log(`[BOQ Parser] Total rows to process: ${totalRows - 1}`);

      for (let rowIndex = 2; rowIndex <= totalRows; rowIndex++) {
        if (progressCallback && rowIndex % 10 === 0) {
          progressCallback({
            current: rowIndex - 1,
            total: totalRows - 1,
            message: `Processing row ${rowIndex - 1} of ${totalRows - 1}...`,
          });
        }

        const row = worksheet.getRow(rowIndex);
        
        // STEP 2: Normalize Excel data - force empty cells to null
        const descriptionCell = row.getCell(COLUMN_INDEXES.DESCRIPTION);
        const quantityCell = row.getCell(COLUMN_INDEXES.QUANTITY);
        const unitCell = row.getCell(COLUMN_INDEXES.UNIT);
        const priceCell = row.getCell(COLUMN_INDEXES.PRICE);
        const totalAmountCell = row.getCell(COLUMN_INDEXES.TOTAL_AMOUNT);

        const description = descriptionCell.value !== null && descriptionCell.value !== undefined
          ? String(descriptionCell.value).trim()
          : null;
        const quantityStr = quantityCell.value !== null && quantityCell.value !== undefined
          ? String(quantityCell.value).trim()
          : null;
        const unit = unitCell.value !== null && unitCell.value !== undefined
          ? String(unitCell.value).trim()
          : null;
        const priceStr = priceCell.value !== null && priceCell.value !== undefined
          ? String(priceCell.value).trim()
          : null;
        const totalAmountStr = totalAmountCell.value !== null && totalAmountCell.value !== undefined
          ? String(totalAmountCell.value).trim()
          : null;

        // Normalize row data
        const normalizedRow = {
          description,
          quantity: quantityStr,
          unit,
          price: priceStr,
          totalAmount: totalAmountStr,
        };

        // Skip completely empty rows
        if (!description && !quantityStr && !unit) {
          skippedCount++;
          continue;
        }

        // Parse numeric values
        const quantity = this.parseAmount(quantityStr);
        const rate = this.parseAmount(priceStr);
        let amount = this.parseAmount(totalAmountStr);

        // STEP 3: Check if this is a section header (has description but no QTY/UNIT)
        if (description && (!quantityStr || !unit || quantity === 0)) {
          // This is likely a section header
          currentSection = description;
          sections.add(description);
          console.log(`[BOQ Parser] Section detected: "${description}"`);
          skippedCount++;
          continue;
        }

        // STEP 1: Validate if this is a valid phase row
        if (!this.isValidPhaseRow(normalizedRow, rowIndex)) {
          skippedCount++;
          continue;
        }

        // Calculate amount if not provided
        if (amount === 0 && quantity > 0 && rate > 0) {
          amount = quantity * rate;
        }

        // STEP 4: Create validated BOQ item
        const item: BOQItem = {
          id: `boq-${rowIndex}`,
          description: description!,
          quantity,
          unit: unit!,
          rate,
          amount,
          section: currentSection || undefined,
          rowIndex,
          rawData: {
            description,
            quantity: quantityStr,
            unit,
            price: priceStr,
            totalAmount: totalAmountStr,
          },
        };

        items.push(item);
        console.log(`[BOQ Parser] ✅ Row ${rowIndex} added: "${description!.substring(0, 40)}" | Qty: ${quantity} | Unit: ${unit}`);
      }

      const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

      console.log(`[BOQ Parser] Excel parsing complete:`, {
        totalRows: totalRows - 1,
        validPhases: items.length,
        skipped: skippedCount,
        sections: Array.from(sections),
      });

      return {
        items,
        totalAmount,
        sections: Array.from(sections),
        uncertainHeaders: [],
        metadata: {
          totalRows: totalRows - 1,
          processedRows: items.length,
          skippedRows: skippedCount,
          fileType: 'Excel',
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error parsing Excel file:', error);
      throw new BadRequestException(
        `Failed to parse Excel file. Please ensure the file is a valid .xlsx file and is not corrupted. Error: ${error.message}`,
      );
    }
  }

  /**
   * Parse CSV line handling quoted values
   */
  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result;
  }

  /**
   * Parse amount from string/number
   */
  private parseAmount(value: string | number | null | undefined): number {
    if (value === null || value === undefined || value === '') {
      return 0;
    }
    
    const str = String(value).trim();
    if (str === '' || str === '-' || str === '—' || str === 'N/A') {
      return 0;
    }
    
    const cleaned = str.replace(/[^\d.-]/g, '').replace(/,/g, '');
    const parsed = Number(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
}
