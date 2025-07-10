export declare enum ReportStatus {
    PROCESSING = "processing",
    READY = "ready",
    FAILED = "failed"
}
export declare class Report {
    id: string;
    name: string;
    description: string;
    type: string;
    parameters: string;
    status: ReportStatus;
    filePath: string;
    fileName: string;
    fileMimeType: string;
    createdAt: Date;
    updatedAt: Date;
}
