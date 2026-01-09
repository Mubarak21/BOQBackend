import { Injectable, BadRequestException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { parseAmount } from '../utils/amount.utils';

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
    const quantity = this.parseAmountValue(row.quantity);
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

    // Parse header row to detect column positions
    const headerLine = allLines[0];
    const headers = this.parseCsvLine(headerLine);
    
    console.log('[BOQ Parser] Detected CSV headers:', headers);

    // Find columns by header name (case-insensitive)
    // Prioritize "description" and "desc" - avoid matching "Item No." by excluding "item" as a standalone term
    const descriptionCol = this.findColumnIndex(headers, ['description', 'desc', 'item description', 'work description']);
    const quantityCol = this.findColumnIndex(headers, ['quantity', 'qty', 'qty.', 'amount', 'qnt']);
    const unitCol = this.findColumnIndex(headers, ['unit', 'units', 'uom', 'unit of measure']);
    const priceCol = this.findColumnIndex(headers, ['price', 'rate', 'unit price', 'unit rate', 'cost per unit']);
    const totalAmountCol = this.findColumnIndex(headers, ['total price', 'total amount', 'total', 'amount', 'total cost', 'totalprice', 'totalamount']);

    console.log('[BOQ Parser] CSV Column mapping:', {
      description: descriptionCol,
      quantity: quantityCol,
      unit: unitCol,
      price: priceCol,
      totalAmount: totalAmountCol,
    });

    // Validate required columns
    if (!descriptionCol) {
      throw new BadRequestException('Could not find DESCRIPTION column in the file. Please ensure your file has a "Description" or "Item Description" column.');
    }
    if (!quantityCol) {
      throw new BadRequestException('Could not find QUANTITY column in the file. Please ensure your file has a "Quantity" or "Qty" column.');
    }
    if (!unitCol) {
      throw new BadRequestException('Could not find UNIT column in the file. Please ensure your file has a "Unit" or "Units" column.');
    }

    const COLUMN_INDEXES = {
      DESCRIPTION: descriptionCol - 1, // Convert to 0-indexed
      QUANTITY: quantityCol - 1,
      UNIT: unitCol - 1,
      PRICE: priceCol ? priceCol - 1 : null,
      TOTAL_AMOUNT: totalAmountCol ? totalAmountCol - 1 : null,
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
      
      // PRESERVE ALL COLUMNS: Create rawData object with all columns from the row
      const rawData: Record<string, any> = {};
      headers.forEach((header, index) => {
        if (header && index < values.length) {
          rawData[header] = (values[index] || '').toString().trim();
        }
      });
      
      // Extract values using detected column positions for validation
      const description = (values[COLUMN_INDEXES.DESCRIPTION] || '').toString().trim();
      const quantityStr = (values[COLUMN_INDEXES.QUANTITY] || '').toString().trim();
      const unit = (values[COLUMN_INDEXES.UNIT] || '').toString().trim();
      const priceStr = COLUMN_INDEXES.PRICE !== null ? (values[COLUMN_INDEXES.PRICE] || '').toString().trim() : '';
      const totalAmountStr = COLUMN_INDEXES.TOTAL_AMOUNT !== null ? (values[COLUMN_INDEXES.TOTAL_AMOUNT] || '').toString().trim() : '';

      // Normalize row data for validation
      const normalizedRow = {
        description: description || null,
        quantity: quantityStr || null,
        unit: unit || null,
        price: priceStr || null,
        totalAmount: totalAmountStr || null,
      };

      // Parse numeric values
      const quantity = this.parseAmountValue(quantityStr);
      const rate = this.parseAmountValue(priceStr);
      let amount = this.parseAmountValue(totalAmountStr);
      
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

      // STEP 4: Create validated BOQ item with ALL row data preserved
      const item: BOQItem = {
        id: `boq-${rowIndex}`,
        description,
        quantity,
        unit,
        rate,
        amount,
        section: currentSection || undefined,
        rowIndex,
        rawData: rawData, // Preserve ALL columns from the row, not just mapped ones
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
   * Find column index by header name (case-insensitive, handles variations)
   * Prioritizes exact matches and excludes common non-matching patterns
   * Handles headers with capital first letters (e.g., "Description", "Quantity", "Unit")
   */
  private findColumnIndex(headers: any[], searchTerms: string[]): number | null {
    // Normalize headers: trim whitespace and handle null/undefined
    const normalizedHeaders = headers.map((h, idx) => ({
      original: String(h || '').trim(),
      normalized: String(h || '').trim().toLowerCase(),
      index: idx
    }));
    
    // First pass: look for exact matches (highest priority) - case-insensitive
    for (const headerInfo of normalizedHeaders) {
      const header = headerInfo.normalized;
      
      for (const term of searchTerms) {
        const termLower = term.toLowerCase();
        // Exact match has highest priority
        if (header === termLower) {
          console.log(`[BOQ Parser] Found exact match for "${term}": Column ${headerInfo.index + 1} = "${headerInfo.original}"`);
          return headerInfo.index + 1; // Return 1-indexed column number
        }
      }
    }
    
    // Second pass: look for partial matches, excluding common false positives
    for (const headerInfo of normalizedHeaders) {
      const header = headerInfo.normalized;
      
      // Skip columns that are clearly not what we're looking for
      if (header.includes('item no') || header.includes('item number') || 
          header.includes('item#') || header === 'no' || header === 'number' ||
          header.startsWith('item no') || header.startsWith('item number') ||
          header.match(/^item\s*no\.?$/i) || header.match(/^item\s*number$/i)) {
        continue;
      }
      
      for (const term of searchTerms) {
        const termLower = term.toLowerCase();
        // Check for partial matches (but not if it's "item" matching "item no")
        if (header.includes(termLower)) {
          // Special handling: if searching for "item", make sure it's not "item no" or "item number"
          if (termLower === 'item' && (header.includes(' no') || header.includes(' number') || header.includes('#'))) {
            continue;
          }
          console.log(`[BOQ Parser] Found partial match for "${term}": Column ${headerInfo.index + 1} = "${headerInfo.original}"`);
          return headerInfo.index + 1; // Return 1-indexed column number
        }
      }
    }
    
    console.log(`[BOQ Parser] No match found for search terms: ${searchTerms.join(', ')}`);
    console.log(`[BOQ Parser] Available headers: ${normalizedHeaders.map(h => `"${h.original}"`).join(', ')}`);
    return null;
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

      // Read header row to detect column positions
      const headerRow = worksheet.getRow(1);
      const headers: any[] = [];
      headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        headers[colNumber - 1] = cell.value;
      });

      console.log('[BOQ Parser] Detected headers:', headers);

      // Find columns by header name (case-insensitive)
      // Prioritize "description" and "desc" - avoid matching "Item No." by excluding "item" as a standalone term
      const descriptionCol = this.findColumnIndex(headers, ['description', 'desc', 'item description', 'work description']);
      const quantityCol = this.findColumnIndex(headers, ['quantity', 'qty', 'qty.', 'amount', 'qnt']);
      const unitCol = this.findColumnIndex(headers, ['unit', 'units', 'uom', 'unit of measure']);
      const priceCol = this.findColumnIndex(headers, ['price', 'rate', 'unit price', 'unit rate', 'cost per unit']);
      const totalAmountCol = this.findColumnIndex(headers, ['total price', 'total amount', 'total', 'amount', 'total cost', 'totalprice', 'totalamount']);

      console.log('[BOQ Parser] Column mapping:', {
        description: descriptionCol,
        quantity: quantityCol,
        unit: unitCol,
        price: priceCol,
        totalAmount: totalAmountCol,
      });

      // Validate required columns
      if (!descriptionCol) {
        throw new BadRequestException('Could not find DESCRIPTION column in the file. Please ensure your file has a "Description" or "Item Description" column.');
      }
      if (!quantityCol) {
        throw new BadRequestException('Could not find QUANTITY column in the file. Please ensure your file has a "Quantity" or "Qty" column.');
      }
      if (!unitCol) {
        throw new BadRequestException('Could not find UNIT column in the file. Please ensure your file has a "Unit" or "Units" column.');
      }

      const COLUMN_INDEXES = {
        DESCRIPTION: descriptionCol,
        QUANTITY: quantityCol,
        UNIT: unitCol,
        PRICE: priceCol || null,
        TOTAL_AMOUNT: totalAmountCol || null,
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
      
      // PRESERVE ALL COLUMNS: Create rawData object with all columns from the Excel row
      const rawData: Record<string, any> = {};
      headers.forEach((header, index) => {
        if (header) {
          const cell = row.getCell(index + 1); // Excel columns are 1-indexed
          if (cell && cell.value !== null && cell.value !== undefined) {
            rawData[header] = String(cell.value).trim();
          } else {
            rawData[header] = '';
          }
        }
      });
      
        // STEP 2: Extract values using detected column positions for validation
      const descriptionCell = row.getCell(COLUMN_INDEXES.DESCRIPTION);
      const quantityCell = row.getCell(COLUMN_INDEXES.QUANTITY);
      const unitCell = row.getCell(COLUMN_INDEXES.UNIT);
      const priceCell = COLUMN_INDEXES.PRICE ? row.getCell(COLUMN_INDEXES.PRICE) : null;
      const totalAmountCell = COLUMN_INDEXES.TOTAL_AMOUNT ? row.getCell(COLUMN_INDEXES.TOTAL_AMOUNT) : null;

      const description = descriptionCell.value !== null && descriptionCell.value !== undefined
        ? String(descriptionCell.value).trim()
          : null;
      const quantityStr = quantityCell.value !== null && quantityCell.value !== undefined
        ? String(quantityCell.value).trim()
          : null;
      const unit = unitCell.value !== null && unitCell.value !== undefined
        ? String(unitCell.value).trim()
          : null;
      const priceStr = priceCell && priceCell.value !== null && priceCell.value !== undefined
        ? String(priceCell.value).trim()
          : null;
      const totalAmountStr = totalAmountCell && totalAmountCell.value !== null && totalAmountCell.value !== undefined
        ? String(totalAmountCell.value).trim()
          : null;

        // Normalize row data for validation
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
      const quantity = this.parseAmountValue(quantityStr);
      const rate = this.parseAmountValue(priceStr);
      let amount = this.parseAmountValue(totalAmountStr);
      
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

        // STEP 4: Create validated BOQ item with ALL row data preserved
      const item: BOQItem = {
        id: `boq-${rowIndex}`,
          description: description!,
          quantity,
          unit: unit!,
        rate,
        amount,
          section: currentSection || undefined,
        rowIndex,
        rawData: rawData, // Preserve ALL columns from the row, not just mapped ones
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

  // Use shared parseAmount utility
  private parseAmountValue = parseAmount;
}
