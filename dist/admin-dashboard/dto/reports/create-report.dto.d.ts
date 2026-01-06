import { ReportType } from "../../../entities/report.entity";
export declare class CreateReportDto {
    name: string;
    description?: string;
    type: ReportType;
    parameters?: {
        projectIds?: string[];
        projectStatus?: string[];
        userIds?: string[];
        userRoles?: string[];
        activityTypes?: string[];
        dataSources?: ("projects" | "users" | "activities" | "analytics")[];
        includeArchived?: boolean;
        includeDeleted?: boolean;
        includeCharts?: boolean;
        includeDetails?: boolean;
        groupBy?: string;
        sortBy?: string;
        sortOrder?: "asc" | "desc";
        includeHeaders?: boolean;
        includeMetadata?: boolean;
    };
    dateFrom?: string;
    dateTo?: string;
}
