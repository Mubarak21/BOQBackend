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
const amount_utils_1 = require("../utils/amount.utils");
let BoqParserService = class BoqParserService {
    constructor() {
        this.parseAmountValue = amount_utils_1.parseAmount;
    }
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
        const quantity = this.parseAmountValue(row.quantity);
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
        const headerLine = allLines[0];
        const headers = this.parseCsvLine(headerLine);
        console.log('[BOQ Parser] Detected CSV headers:', headers);
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
        if (!descriptionCol) {
            throw new common_1.BadRequestException('Could not find DESCRIPTION column in the file. Please ensure your file has a "Description" or "Item Description" column.');
        }
        if (!quantityCol) {
            throw new common_1.BadRequestException('Could not find QUANTITY column in the file. Please ensure your file has a "Quantity" or "Qty" column.');
        }
        if (!unitCol) {
            throw new common_1.BadRequestException('Could not find UNIT column in the file. Please ensure your file has a "Unit" or "Units" column.');
        }
        const COLUMN_INDEXES = {
            DESCRIPTION: descriptionCol - 1,
            QUANTITY: quantityCol - 1,
            UNIT: unitCol - 1,
            PRICE: priceCol ? priceCol - 1 : null,
            TOTAL_AMOUNT: totalAmountCol ? totalAmountCol - 1 : null,
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
            const rawData = {};
            headers.forEach((header, index) => {
                if (header && index < values.length) {
                    rawData[header] = (values[index] || '').toString().trim();
                }
            });
            const description = (values[COLUMN_INDEXES.DESCRIPTION] || '').toString().trim();
            const quantityStr = (values[COLUMN_INDEXES.QUANTITY] || '').toString().trim();
            const unit = (values[COLUMN_INDEXES.UNIT] || '').toString().trim();
            const priceStr = COLUMN_INDEXES.PRICE !== null ? (values[COLUMN_INDEXES.PRICE] || '').toString().trim() : '';
            const totalAmountStr = COLUMN_INDEXES.TOTAL_AMOUNT !== null ? (values[COLUMN_INDEXES.TOTAL_AMOUNT] || '').toString().trim() : '';
            const normalizedRow = {
                description: description || null,
                quantity: quantityStr || null,
                unit: unit || null,
                price: priceStr || null,
                totalAmount: totalAmountStr || null,
            };
            const quantity = this.parseAmountValue(quantityStr);
            const rate = this.parseAmountValue(priceStr);
            let amount = this.parseAmountValue(totalAmountStr);
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
                rawData: rawData,
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
    findColumnIndex(headers, searchTerms) {
        const normalizedHeaders = headers.map((h, idx) => ({
            original: String(h || '').trim(),
            normalized: String(h || '').trim().toLowerCase(),
            index: idx
        }));
        for (const headerInfo of normalizedHeaders) {
            const header = headerInfo.normalized;
            for (const term of searchTerms) {
                const termLower = term.toLowerCase();
                if (header === termLower) {
                    console.log(`[BOQ Parser] Found exact match for "${term}": Column ${headerInfo.index + 1} = "${headerInfo.original}"`);
                    return headerInfo.index + 1;
                }
            }
        }
        for (const headerInfo of normalizedHeaders) {
            const header = headerInfo.normalized;
            if (header.includes('item no') || header.includes('item number') ||
                header.includes('item#') || header === 'no' || header === 'number' ||
                header.startsWith('item no') || header.startsWith('item number') ||
                header.match(/^item\s*no\.?$/i) || header.match(/^item\s*number$/i)) {
                continue;
            }
            for (const term of searchTerms) {
                const termLower = term.toLowerCase();
                if (header.includes(termLower)) {
                    if (termLower === 'item' && (header.includes(' no') || header.includes(' number') || header.includes('#'))) {
                        continue;
                    }
                    console.log(`[BOQ Parser] Found partial match for "${term}": Column ${headerInfo.index + 1} = "${headerInfo.original}"`);
                    return headerInfo.index + 1;
                }
            }
        }
        console.log(`[BOQ Parser] No match found for search terms: ${searchTerms.join(', ')}`);
        console.log(`[BOQ Parser] Available headers: ${normalizedHeaders.map(h => `"${h.original}"`).join(', ')}`);
        return null;
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
            const headerRow = worksheet.getRow(1);
            const headers = [];
            headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                headers[colNumber - 1] = cell.value;
            });
            console.log('[BOQ Parser] Detected headers:', headers);
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
            if (!descriptionCol) {
                throw new common_1.BadRequestException('Could not find DESCRIPTION column in the file. Please ensure your file has a "Description" or "Item Description" column.');
            }
            if (!quantityCol) {
                throw new common_1.BadRequestException('Could not find QUANTITY column in the file. Please ensure your file has a "Quantity" or "Qty" column.');
            }
            if (!unitCol) {
                throw new common_1.BadRequestException('Could not find UNIT column in the file. Please ensure your file has a "Unit" or "Units" column.');
            }
            const COLUMN_INDEXES = {
                DESCRIPTION: descriptionCol,
                QUANTITY: quantityCol,
                UNIT: unitCol,
                PRICE: priceCol || null,
                TOTAL_AMOUNT: totalAmountCol || null,
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
                const rawData = {};
                headers.forEach((header, index) => {
                    if (header) {
                        const cell = row.getCell(index + 1);
                        if (cell && cell.value !== null && cell.value !== undefined) {
                            rawData[header] = String(cell.value).trim();
                        }
                        else {
                            rawData[header] = '';
                        }
                    }
                });
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
                const quantity = this.parseAmountValue(quantityStr);
                const rate = this.parseAmountValue(priceStr);
                let amount = this.parseAmountValue(totalAmountStr);
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
                    rawData: rawData,
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
};
exports.BoqParserService = BoqParserService;
exports.BoqParserService = BoqParserService = __decorate([
    (0, common_1.Injectable)()
], BoqParserService);
//# sourceMappingURL=boq-parser.service.js.map