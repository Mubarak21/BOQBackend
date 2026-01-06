import { Project } from "../../entities/project.entity";
import { User } from "../../entities/user.entity";
import { BudgetCategory } from "./budget-category.entity";
export declare enum TransactionType {
    EXPENSE = "expense",
    REFUND = "refund",
    ADJUSTMENT = "adjustment"
}
export declare enum ApprovalStatus {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected"
}
export declare class ProjectTransaction {
    id: string;
    projectId: string;
    project: Project;
    categoryId: string;
    category: BudgetCategory;
    transactionNumber: string;
    amount: number;
    type: TransactionType;
    description: string;
    vendor: string;
    invoiceNumber: string;
    transactionDate: Date;
    approvalStatus: ApprovalStatus;
    approvedBy: string;
    approver: User;
    approvedAt: Date;
    receiptUrl: string;
    notes: string;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    creator: User;
}
