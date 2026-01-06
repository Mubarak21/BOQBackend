import { ProjectStatus } from "../../entities/project.entity";
export declare class ProjectFinanceQueryDto {
    page?: number;
    limit?: number;
    search?: string;
    status?: ProjectStatus;
    dateFrom?: Date;
    dateTo?: Date;
    budgetMin?: number;
    budgetMax?: number;
    savingsMin?: number;
    savingsMax?: number;
}
