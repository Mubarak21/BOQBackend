import { ReportType, ReportStatus } from "../../../entities/report.entity";
export declare class ReportQueryDto {
    page?: number;
    limit?: number;
    search?: string;
    type?: ReportType;
    status?: ReportStatus;
    dateFrom?: string;
    dateTo?: string;
    generatedBy?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}
