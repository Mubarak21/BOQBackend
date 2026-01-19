import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  forwardRef,
  Inject,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { Project } from "../../entities/project.entity";
import { ProjectAccessRequest } from "../../entities/project-access-request.entity";
import { User } from "../../entities/user.entity";
import { UsersService } from "../../users/users.service";
import { ActivitiesService } from "../../activities/activities.service";
import { ProjectsService } from "../projects.service";

@Injectable()
export class ProjectCollaborationService {
  constructor(
    @InjectRepository(Project)
    private readonly projectsRepository: Repository<Project>,
    @InjectRepository(ProjectAccessRequest)
    private readonly accessRequestRepository: Repository<ProjectAccessRequest>,
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => ActivitiesService))
    private readonly activitiesService: ActivitiesService,
    @Inject(forwardRef(() => ProjectsService))
    private readonly projectsService: ProjectsService
  ) {}

  async addCollaborator(
    projectId: string,
    collaborator: User,
    userId: string
  ): Promise<Project> {
    const project = await this.projectsService.findOne(projectId);
    const user = await this.usersService.findOne(userId);
    const isAdmin = user?.role === "admin";
    const isConsultant = user?.role === "consultant";

    if (project.owner_id !== userId && !isAdmin && !isConsultant) {
      throw new ForbiddenException(
        "Only the project owner, admin, or consultant can add collaborators"
      );
    }

    if (!project.collaborators) {
      project.collaborators = [];
    }

    if (project.collaborators.some((c) => c.id === collaborator.id)) {
      throw new BadRequestException("User is already a collaborator");
    }

    if (project.owner_id === collaborator.id) {
      throw new BadRequestException("Owner cannot be added as collaborator");
    }

    project.collaborators.push(collaborator);
    return this.projectsRepository.save(project);
  }

  async removeCollaborator(
    projectId: string,
    collaboratorId: string,
    userId: string
  ): Promise<Project> {
    const project = await this.projectsService.findOne(projectId);
    const user = await this.usersService.findOne(userId);
    const isAdmin = user?.role === "admin";
    const isConsultant = user?.role === "consultant";

    if (project.owner_id !== userId && !isAdmin && !isConsultant) {
      throw new ForbiddenException(
        "Only the project owner, admin, or consultant can remove collaborators"
      );
    }

    const initialLength = project.collaborators?.length || 0;
    project.collaborators =
      project.collaborators?.filter((c) => c.id !== collaboratorId) || [];

    if (project.collaborators.length === initialLength) {
      throw new NotFoundException("Collaborator not found in project");
    }

    return this.projectsRepository.save(project);
  }

  async createJoinRequest(projectId: string, requesterId: string) {
    const existing = await this.accessRequestRepository.findOne({
      where: {
        project_id: projectId,
        requester_id: requesterId,
        status: "pending",
      },
    });
    if (existing)
      throw new BadRequestException("A pending join request already exists.");
    const request = this.accessRequestRepository.create({
      project_id: projectId,
      requester_id: requesterId,
      status: "pending",
    });
    const savedRequest = await this.accessRequestRepository.save(request);
    return savedRequest;
  }

  async listJoinRequestsForProject(projectId: string, ownerId: string) {
    const project = await this.projectsRepository.findOne({
      where: { id: projectId },
    });
    if (!project) throw new NotFoundException("Project not found");
    const user = await this.usersService.findOne(ownerId);
    const isAdmin = user?.role === "admin";
    const isConsultant = user?.role === "consultant";
    if (project.owner_id !== ownerId && !isAdmin && !isConsultant)
      throw new ForbiddenException(
        "Only the owner, admin, or consultant can view join requests"
      );
    return this.accessRequestRepository.find({
      where: { project_id: projectId },
      order: { created_at: "DESC" },
    });
  }

  async approveJoinRequest(
    projectId: string,
    requestId: string,
    ownerId: string
  ) {
    const project = await this.projectsRepository.findOne({
      where: { id: projectId },
      relations: ["collaborators"],
    });
    if (!project) throw new NotFoundException("Project not found");
    const user = await this.usersService.findOne(ownerId);
    const isAdmin = user?.role === "admin";
    const isConsultant = user?.role === "consultant";
    if (project.owner_id !== ownerId && !isAdmin && !isConsultant)
      throw new ForbiddenException(
        "Only the owner, admin, or consultant can approve join requests"
      );
    const request = await this.accessRequestRepository.findOne({
      where: { id: requestId, project_id: projectId },
    });
    if (!request) throw new NotFoundException("Join request not found");
    if (request.status !== "pending")
      throw new BadRequestException("Request is not pending");
    const requesterUser = await this.usersService.findOne(request.requester_id);
    if (!project.collaborators.some((c) => c.id === requesterUser.id)) {
      project.collaborators.push(requesterUser);
      await this.projectsRepository.save(project);
    }
    request.status = "approved";
    request.reviewed_at = new Date();
    return this.accessRequestRepository.save(request);
  }

  async denyJoinRequest(
    projectId: string,
    requestId: string,
    ownerId: string
  ) {
    const project = await this.projectsRepository.findOne({
      where: { id: projectId },
    });
    if (!project) throw new NotFoundException("Project not found");
    const user = await this.usersService.findOne(ownerId);
    const isAdmin = user?.role === "admin";
    const isConsultant = user?.role === "consultant";
    if (project.owner_id !== ownerId && !isAdmin && !isConsultant)
      throw new ForbiddenException(
        "Only the owner, admin, or consultant can deny join requests"
      );
    const request = await this.accessRequestRepository.findOne({
      where: { id: requestId, project_id: projectId },
    });
    if (!request) throw new NotFoundException("Join request not found");
    if (request.status !== "pending")
      throw new BadRequestException("Request is not pending");
    request.status = "denied";
    request.reviewed_at = new Date();
    return this.accessRequestRepository.save(request);
  }

  async listMyJoinRequests(userId: string) {
    return this.accessRequestRepository.find({
      where: { requester_id: userId },
      order: { created_at: "DESC" },
    });
  }

  async listJoinRequestsForOwner(ownerId: string) {
    const projects = await this.projectsRepository.find({
      where: { owner_id: ownerId },
    });
    const projectIds = projects.map((p) => p.id);
    if (projectIds.length === 0) return [];
    return this.accessRequestRepository.find({
      where: { project_id: In(projectIds) },
      order: { created_at: "DESC" },
    });
  }
}


