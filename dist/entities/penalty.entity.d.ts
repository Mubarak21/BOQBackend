import { User } from "./user.entity";
import { Project } from "./project.entity";
import { Phase } from "./phase.entity";
import { Complaint } from "./complaint.entity";
export declare enum PenaltyStatus {
    PENDING = "pending",
    PAID = "paid",
    APPEALED = "appealed",
    WAIVED = "waived"
}
export declare class Penalty {
    id: string;
    project_id: string;
    phase_id: string;
    complaint_id: string;
    amount: number;
    reason: string;
    status: PenaltyStatus;
    assigned_to: string;
    assigned_by: string;
    appeal_reason: string;
    appealed_at: Date;
    paid_at: Date;
    created_at: Date;
    updated_at: Date;
    project: Project;
    phase: Phase;
    complaint: Complaint;
    assignee: User;
    assigner: User;
}
