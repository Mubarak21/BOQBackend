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
    userId: string;
    user: User;
    inviterId: string;
    inviter: User;
    status: CollaborationRequestStatus;
    createdAt: Date;
}
