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
export declare class BoqParserService {
    parseBoqFile(file: Express.Multer.File, progressCallback?: (progress: {
        current: number;
        total: number;
        message: string;
    }) => void): Promise<BOQParseResult>;
    private isValidPhaseRow;
    private parseCsvFile;
    private parseExcelFile;
    private parseCsvLine;
    private parseAmount;
}
