import { Phase } from "../../entities/phase.entity";

export class ProjectResponseDto {
  id: string;
  name: string;
  description: string;
  startDate?: Date;
  estimatedCompletion?: Date;
  owner: string;
  collaborators?: string[];
  tags?: string[];
  phases?: Phase[];
  isOwner: boolean;
  isCollaborator: boolean;
}

export class PublicProjectResponseDto {
  id: string;
  name: string;
  description: string;
  owner: string;
  tags?: string[];
  isOwner: boolean;
  isCollaborator: boolean;
}
