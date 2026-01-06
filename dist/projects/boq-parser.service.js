"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BoqParserService = void 0;
const common_1 = require("@nestjs/common");
const ExcelJS = require("exceljs");
let BoqParserService = class BoqParserService {
    async parseBoqFile(file, progressCallback) {
        const fileExtension = file.originalname
            .toLowerCase()
            .substring(file.originalname.lastIndexOf('.'));
        console.log(`[BOQ Parser] Processing file: ${file.originalname} (${fileExtension})`);
        if (fileExtension === '.csv') {
            return this.parseCsvFile(file, progressCallback);
        }
        else if (fileExtension === '.xlsx') {
            return this.parseExcelFile(file, progressCallback);
        }
        else if (fileExtension === '.xls') {
            throw new common_1.BadRequestException(`Legacy Excel format (.xls) is not supported. Please save your file as .xlsx (Excel 2007+) format.`);
        }
        else {
            throw new common_1.BadRequestException(`Unsupported file type: ${fileExtension}. Please upload CSV (.csv) or Excel (.xlsx) files.`);
        }
    }
    isValidPhaseRow(row, rowIndex) {
        const description = row.description?.toString().trim();
        const quantity = this.parseAmount(row.quantity);
        const unit = row.unit?.toString().trim();
        const isValid = !!(description &&
            description.length > 0 &&
            unit &&
            unit.length > 0 &&
            !isNaN(quantity) &&
            quantity > 0);
        if (!isValid) {
            console.log(`[BOQ Parser] Row ${rowIndex} skipped - Reason: ${!description ? 'No description' :
                !unit ? 'No unit' :
                    isNaN(quantity) ? 'Invalid quantity' :
                        quantity <= 0 ? 'Quantity is 0 or negative' :
                            'Unknown'}`, {
                description: description?.substring(0, 50),
                quantity,
                unit,
            });
        }
        return isValid;
    }
    async parseCsvFile(file, progressCallback) {
        console.log('[BOQ Parser] Starting CSV parsing...');
        const csvContent = file.buffer.toString('utf-8');
        const allLines = csvContent.split(/\r?\n/).filter((line) => line.trim().length > 0);
        if (allLines.length < 2) {
            throw new common_1.BadRequestException('CSV file must have at least a header row and one data row');
        }
        const COLUMN_INDEXES = {
            DESCRIPTION: 1,
            QUANTITY: 2,
            UNIT: 3,
            PRICE: 4,
            TOTAL_AMOUNT: 5,
        };
        const items = [];
        const sections = new Set();
        const dataLines = allLines.slice(1);
        let currentSection = null;
        let skippedCount = 0;
        console.log(`[BOQ Parser] Total rows to process: ${dataLines.length}`);
        for (let i = 0; i < dataLines.length; i++) {
            const line = dataLines[i];
            const rowIndex = i + 2;
            if (progressCallback && i % 10 === 0) {
                progressCallback({
                    current: i + 1,
                    total: dataLines.length,
                    message: `Processing row ${i + 1} of ${dataLines.length}...`,
                });
            }
            const values = this.parseCsvLine(line);
            if (values.length < COLUMN_INDEXES.TOTAL_AMOUNT + 1) {
                skippedCount++;
                continue;
            }
            const description = (values[COLUMN_INDEXES.DESCRIPTION] || '').toString().trim();
            const quantityStr = (values[COLUMN_INDEXES.QUANTITY] || '').toString().trim();
            const unit = (values[COLUMN_INDEXES.UNIT] || '').toString().trim();
            const priceStr = (values[COLUMN_INDEXES.PRICE] || '').toString().trim();
            const totalAmountStr = (values[COLUMN_INDEXES.TOTAL_AMOUNT] || '').toString().trim();
            const normalizedRow = {
                description: description || null,
                quantity: quantityStr || null,
                unit: unit || null,
                price: priceStr || null,
                totalAmount: totalAmountStr || null,
            };
            const quantity = this.parseAmount(quantityStr);
            const rate = this.parseAmount(priceStr);
            let amount = this.parseAmount(totalAmountStr);
            if (description && (!quantityStr || !unit || quantity === 0)) {
                currentSection = description;
                sections.add(description);
                console.log(`[BOQ Parser] Section detected: "${description}"`);
                skippedCount++;
                continue;
            }
            if (!this.isValidPhaseRow(normalizedRow, rowIndex)) {
                skippedCount++;
                continue;
            }
            if (amount === 0 && quantity > 0 && rate > 0) {
                amount = quantity * rate;
            }
            const item = {
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
    async parseExcelFile(file, progressCallback) {
        console.log('[BOQ Parser] Starting Excel parsing...');
        try {
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(file.buffer);
            const worksheet = workbook.worksheets[0];
            if (!worksheet) {
                throw new common_1.BadRequestException('Excel file must have at least one worksheet');
            }
            if (worksheet.rowCount < 2) {
                throw new common_1.BadRequestException('Excel file must have at least a header row and one data row');
            }
            const COLUMN_INDEXES = {
                DESCRIPTION: 2,
                QUANTITY: 3,
                UNIT: 4,
                PRICE: 5,
                TOTAL_AMOUNT: 6,
            };
            const items = [];
            const sections = new Set();
            const totalRows = worksheet.rowCount;
            let currentSection = null;
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
                const normalizedRow = {
                    description,
                    quantity: quantityStr,
                    unit,
                    price: priceStr,
                    totalAmount: totalAmountStr,
                };
                if (!description && !quantityStr && !unit) {
                    skippedCount++;
                    continue;
                }
                const quantity = this.parseAmount(quantityStr);
                const rate = this.parseAmount(priceStr);
                let amount = this.parseAmount(totalAmountStr);
                if (description && (!quantityStr || !unit || quantity === 0)) {
                    currentSection = description;
                    sections.add(description);
                    console.log(`[BOQ Parser] Section detected: "${description}"`);
                    skippedCount++;
                    continue;
                }
                if (!this.isValidPhaseRow(normalizedRow, rowIndex)) {
                    skippedCount++;
                    continue;
                }
                if (amount === 0 && quantity > 0 && rate > 0) {
                    amount = quantity * rate;
                }
                const item = {
                    id: `boq-${rowIndex}`,
                    description: description,
                    quantity,
                    unit: unit,
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
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            console.error('Error parsing Excel file:', error);
            throw new common_1.BadRequestException(`Failed to parse Excel file. Please ensure the file is a valid .xlsx file and is not corrupted. Error: ${error.message}`);
        }
    }
    parseCsvLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++;
                }
                else {
                    inQuotes = !inQuotes;
                }
            }
            else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            }
            else {
                current += char;
            }
        }
        result.push(current);
        return result;
    }
    parseAmount(value) {
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
};
exports.BoqParserService = BoqParserService;
exports.BoqParserService = BoqParserService = __decorate([
    (0, common_1.Injectable)()
], BoqParserService);
//# sourceMappingURL=boq-parser.service.js.map