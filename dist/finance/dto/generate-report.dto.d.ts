import { FileFormat } from "../entities/financial-report.entity";
export declare class GenerateReportDto {
    format: FileFormat;
    includeProjects?: boolean;
    includeProgress?: boolean;
    includeInventory?: boolean;
    includePayments?: boolean;
    projectIds?: string[];
    dateFrom?: string;
    dateTo?: string;
}
