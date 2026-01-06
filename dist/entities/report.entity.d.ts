import { User } from "./user.entity";
export declare enum ReportStatus {
    SCHEDULED = "scheduled",
    PROCESSING = "processing",
    READY = "ready",
    FAILED = "failed"
}
export declare enum ReportType {
    PDF = "PDF",
    XLSX = "XLSX",
    CSV = "CSV",
    JSON = "JSON"
}
export declare class Report {
    id: string;
    name: string;
    description: string;
    type: ReportType;
    parameters: any;
    status: ReportStatus;
    filePath: string;
    fileName: string;
    fileMimeType: string;
    fileSize: number;
    generatedBy: User;
    generated_by: string;
    dateFrom: Date;
    dateTo: Date;
    error: string;
    retentionDate: Date;
    progress: number;
    createdAt: Date;
    updatedAt: Date;
}
