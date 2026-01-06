import { ProjectStatus } from "../../entities/project.entity";
export declare class BudgetCategoryDto {
    id: string;
    projectId: string;
    name: string;
    description?: string;
    budgetedAmount: number;
    spentAmount: number;
    remainingAmount: number;
    utilizationPercentage: number;
    status: "on_track" | "warning" | "over_budget";
    isActive: boolean;
}
export declare class CategorySpendingDto {
    categoryId: string;
    categoryName: string;
    budgetedAmount: number;
    spentAmount: number;
    remainingAmount: number;
    utilizationPercentage: number;
    status: "on_track" | "warning" | "over_budget";
}
export declare class MonthlySpendingDto {
    month: string;
    budgetedAmount: number;
    spentAmount: number;
    variance: number;
    variancePercentage: number;
}
export declare class TransactionDto {
    id: string;
    projectId: string;
    categoryId?: string;
    transactionNumber: string;
    amount: number;
    type: "expense" | "refund" | "adjustment";
    description: string;
    vendor?: string;
    invoiceNumber?: string;
    transactionDate: string;
    approvalStatus: "pending" | "approved" | "rejected";
    approvedBy?: string;
    approvedAt?: string;
    receiptUrl?: string;
    notes?: string;
    createdAt: string;
    createdBy: string;
}
export declare class SavingsBreakdownDto {
    category: string;
    budgetedAmount: number;
    actualAmount: number;
    savedAmount: number;
    savingsPercentage: number;
    reason?: string;
}
export declare class SavingsReasonDto {
    category: string;
    reason: string;
    description?: string;
    savedAmount: number;
    achievedDate?: string;
}
export declare class BudgetDto {
    total: number;
    allocated: number;
    remaining: number;
    categories: BudgetCategoryDto[];
}
export declare class SpendingDto {
    total: number;
    byCategory: CategorySpendingDto[];
    byMonth: MonthlySpendingDto[];
    transactions: TransactionDto[];
}
export declare class SavingsDto {
    total: number;
    percentage: number;
    breakdown: SavingsBreakdownDto[];
    reasons: SavingsReasonDto[];
}
export declare class TimelineDto {
    startDate: string;
    endDate: string;
    estimatedEndDate: string;
}
export declare class ProjectFinanceDto {
    id: string;
    projectId: string;
    projectName: string;
    status: ProjectStatus;
    budget: BudgetDto;
    spending: SpendingDto;
    savings: SavingsDto;
    timeline: TimelineDto;
    lastUpdated: string;
}
export declare class FinanceMetricsDto {
    totalProjects: number;
    totalBudget: number;
    totalSpent: number;
    totalSaved: number;
    avgSavingsPercentage: number;
    projectsOverBudget: number;
    projectsUnderBudget: number;
}
export declare class ProjectFinanceListResponseDto {
    projects: ProjectFinanceDto[];
    metrics: FinanceMetricsDto;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
