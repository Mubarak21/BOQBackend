import { Repository } from "typeorm";
import { ProjectTransaction } from "../entities/project-transaction.entity";
import { BudgetCategory } from "../entities/budget-category.entity";
export declare class AnalyticsService {
    private readonly transactionRepository;
    private readonly budgetCategoryRepository;
    constructor(transactionRepository: Repository<ProjectTransaction>, budgetCategoryRepository: Repository<BudgetCategory>);
    getSpendingTrends(period: string, projectId?: string, dateFrom?: string, dateTo?: string): Promise<{
        trends: {
            period: any;
            amount: number;
            budgeted: number;
            variance: number;
        }[];
    }>;
    getCategoryBreakdown(): Promise<{
        categories: {
            category: any;
            amount: number;
            percentage: number;
            budgeted: number;
            variance: number;
        }[];
    }>;
}
