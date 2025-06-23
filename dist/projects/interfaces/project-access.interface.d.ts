import { Project } from "../../entities/project.entity";
import { User } from "../../entities/user.entity";
export interface ProjectAccess {
    isOwner: boolean;
    isCollaborator: boolean;
}
export interface ProjectAccessParams {
    project: Project;
    userId?: string;
}
export interface CollaboratorParams {
    project: Project;
    collaborator: User;
    userId: string;
}
