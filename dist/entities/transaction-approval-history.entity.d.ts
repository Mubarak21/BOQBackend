import { ProjectTransaction } from "../finance/entities/project-transaction.entity";
import { User } from "./user.entity";
export declare enum ApprovalAction {
    APPROVED = "approved",
    REJECTED = "rejected",
    PENDING = "pending",
    REQUESTED_CHANGES = "requested_changes"
}
export declare class TransactionApprovalHistory {
    id: string;
    transactionId: string;
    transaction: ProjectTransaction;
    action: ApprovalAction;
    actionBy: string;
    actor: User;
    comment: string;
    reason: string;
    createdAt: Date;
}
