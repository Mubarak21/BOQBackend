import { Project } from "./project.entity";
import { User } from "./user.entity";
export type ProjectAccessRequestStatus = "pending" | "approved" | "denied";
export declare class ProjectAccessRequest {
    id: string;
    project_id: string;
    project: Project;
    requester_id: string;
    requester: User;
    status: ProjectAccessRequestStatus;
    created_at: Date;
    reviewed_at: Date;
    updated_at: Date;
}
