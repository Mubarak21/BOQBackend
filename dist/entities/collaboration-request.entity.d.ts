import { Project } from "./project.entity";
import { User } from "./user.entity";
export declare enum CollaborationRequestStatus {
    PENDING = "pending",
    ACCEPTED = "accepted",
    REJECTED = "rejected"
}
export declare class CollaborationRequest {
    id: string;
    projectId: string;
    project: Project;
    userId: string | null;
    user: User | null;
    inviteEmail: string | null;
    inviterId: string;
    inviter: User;
    status: CollaborationRequestStatus;
    tokenHash: string;
    expiresAt: Date;
    createdAt: Date;
}
