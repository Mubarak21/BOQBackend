import { FinanceService } from "../../../finance/services/finance.service";
export declare class AdminFinanceController {
    private readonly financeService;
    constructor(financeService: FinanceService);
    getFinancialMetrics(): Promise<{
        totalProjects: number;
        totalBudget: number;
        totalSpent: number;
        totalSaved: number;
        avgSavingsPercentage: number;
        projectsOverBudget: number;
        projectsUnderBudget: number;
    }>;
    getRevenueBreakdown(): Promise<{
        category: any;
        amount: number;
    }[]>;
    getExpenseBreakdown(): Promise<{
        category: any;
        amount: number;
    }[]>;
}
