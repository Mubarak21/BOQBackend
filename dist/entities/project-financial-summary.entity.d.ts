import { Project } from "./project.entity";
export declare class ProjectFinancialSummary {
    id: string;
    project_id: string;
    project: Project;
    totalBudget: number;
    allocatedBudget: number;
    spentAmount: number;
    estimatedSavings: number;
    receivedAmount: number;
    paidAmount: number;
    netCashFlow: number;
    financialStatus: "on_track" | "warning" | "over_budget" | "excellent";
    budgetLastUpdated: Date;
    lastTransactionDate: Date;
    createdAt: Date;
    updatedAt: Date;
}
