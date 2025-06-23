import { ProjectAccess, ProjectAccessParams, CollaboratorParams } from "../interfaces/project-access.interface";
export declare class ProjectAccessService {
    checkProjectAccess({ project, userId }: ProjectAccessParams): ProjectAccess;
    hasProjectAccess({ project, userId }: ProjectAccessParams): boolean;
    validateCollaboratorOperation({ project, collaborator, userId, }: CollaboratorParams): void;
}
