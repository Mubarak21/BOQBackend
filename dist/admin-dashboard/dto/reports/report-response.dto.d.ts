import { ReportType, ReportStatus } from "../../../entities/report.entity";
export declare class ReportResponseDto {
    id: string;
    name: string;
    description?: string;
    type: ReportType;
    status: ReportStatus;
    progress: number;
    parameters?: any;
    fileName?: string;
    fileMimeType?: string;
    fileSize?: number;
    dateFrom?: Date;
    dateTo?: Date;
    generatedBy?: {
        id: string;
        display_name: string;
        email: string;
    };
    error?: string;
    createdAt: Date;
    updatedAt: Date;
    retentionDate?: Date;
}
export declare class ReportListResponseDto {
    items: ReportResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
export declare class ReportDownloadResponseDto {
    message: string;
    downloadUrl?: string;
    fileName: string;
    fileSize: number;
    contentType: string;
}
