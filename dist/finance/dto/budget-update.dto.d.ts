export declare class BudgetCategoryUpdateDto {
    categoryId: string;
    budgetedAmount: number;
}
export declare class UpdateProjectBudgetDto {
    totalBudget: number;
    categories: BudgetCategoryUpdateDto[];
}
export declare class BudgetAlertConfigDto {
    projectId: string;
    warningThreshold: number;
    criticalThreshold: number;
    emailNotifications: boolean;
}
