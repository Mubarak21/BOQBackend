import { Project } from "../../entities/project.entity";
import { User } from "../../entities/user.entity";
import { ProjectTransaction } from "./project-transaction.entity";
export declare class BudgetCategory {
    id: string;
    projectId: string;
    project: Project;
    name: string;
    description: string;
    budgetedAmount: number;
    spentAmount: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    creator: User;
    transactions: ProjectTransaction[];
    get remainingAmount(): number;
    get utilizationPercentage(): number;
    get status(): "on_track" | "warning" | "over_budget";
}
