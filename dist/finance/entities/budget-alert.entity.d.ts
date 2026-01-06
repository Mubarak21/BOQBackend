import { Project } from "../../entities/project.entity";
export declare enum AlertType {
    WARNING = "warning",
    CRITICAL = "critical",
    OVER_BUDGET = "over_budget"
}
export declare class BudgetAlert {
    id: string;
    projectId: string;
    project: Project;
    alertType: AlertType;
    thresholdPercentage: number;
    currentPercentage: number;
    triggeredAt: Date;
    resolvedAt: Date;
    notificationSent: boolean;
    emailRecipients: string[];
    isActive: boolean;
    get isResolved(): boolean;
    get severityLevel(): "low" | "medium" | "high";
}
