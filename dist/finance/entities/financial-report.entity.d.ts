import { User } from "../../entities/user.entity";
export declare enum ReportType {
    SUMMARY = "summary",
    DETAILED = "detailed",
    TRANSACTIONS = "transactions",
    SAVINGS = "savings"
}
export declare enum FileFormat {
    PDF = "pdf",
    EXCEL = "excel",
    CSV = "csv",
    WORD = "word"
}
export declare enum GenerationStatus {
    PENDING = "pending",
    PROCESSING = "processing",
    COMPLETED = "completed",
    FAILED = "failed"
}
export declare class FinancialReport {
    id: string;
    reportName: string;
    reportType: ReportType;
    fileFormat: FileFormat;
    filePath: string;
    fileSize: number;
    dateRangeFrom: Date;
    dateRangeTo: Date;
    projectIds: string[];
    parameters: any;
    generationStatus: GenerationStatus;
    generatedAt: Date;
    generatedBy: string;
    generator: User;
    downloadCount: number;
    expiresAt: Date;
    createdAt: Date;
    get isExpired(): boolean;
    get isReady(): boolean;
    get fileSizeFormatted(): string;
}
