import { Injectable } from "@nestjs/common";
import {
  ProjectAccess,
  ProjectAccessParams,
  CollaboratorParams,
} from "../interfaces/project-access.interface";
import { ForbiddenException, BadRequestException } from "@nestjs/common";

@Injectable()
export class ProjectAccessService {
  checkProjectAccess({ project, userId }: ProjectAccessParams): ProjectAccess {
    const isOwner = userId ? project.owner_id === userId : false;
    const isCollaborator = userId
      ? (project.collaborators || []).some((c) => c.id === userId)
      : false;

    return { isOwner, isCollaborator };
  }

  hasProjectAccess({ project, userId }: ProjectAccessParams): boolean {
    const { isOwner, isCollaborator } = this.checkProjectAccess({
      project,
      userId,
    });
    return isOwner || isCollaborator;
  }

  validateCollaboratorOperation({
    project,
    collaborator,
    userId,
  }: CollaboratorParams): void {
    if (project.owner_id !== userId) {
      throw new ForbiddenException(
        "Only the project owner can manage collaborators"
      );
    }

    if (project.collaborators?.some((c) => c.id === collaborator.id)) {
      throw new BadRequestException("User is already a collaborator");
    }

    if (project.owner_id === collaborator.id) {
      throw new BadRequestException("Owner cannot be added as collaborator");
    }
  }
}
