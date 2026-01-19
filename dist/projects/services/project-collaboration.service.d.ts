import { Repository } from "typeorm";
import { Project } from "../../entities/project.entity";
import { ProjectAccessRequest } from "../../entities/project-access-request.entity";
import { User } from "../../entities/user.entity";
import { UsersService } from "../../users/users.service";
import { ActivitiesService } from "../../activities/activities.service";
import { ProjectsService } from "../projects.service";
export declare class ProjectCollaborationService {
    private readonly projectsRepository;
    private readonly accessRequestRepository;
    private readonly usersService;
    private readonly activitiesService;
    private readonly projectsService;
    constructor(projectsRepository: Repository<Project>, accessRequestRepository: Repository<ProjectAccessRequest>, usersService: UsersService, activitiesService: ActivitiesService, projectsService: ProjectsService);
    addCollaborator(projectId: string, collaborator: User, userId: string): Promise<Project>;
    removeCollaborator(projectId: string, collaboratorId: string, userId: string): Promise<Project>;
    createJoinRequest(projectId: string, requesterId: string): Promise<ProjectAccessRequest>;
    listJoinRequestsForProject(projectId: string, ownerId: string): Promise<ProjectAccessRequest[]>;
    approveJoinRequest(projectId: string, requestId: string, ownerId: string): Promise<ProjectAccessRequest>;
    denyJoinRequest(projectId: string, requestId: string, ownerId: string): Promise<ProjectAccessRequest>;
    listMyJoinRequests(userId: string): Promise<ProjectAccessRequest[]>;
    listJoinRequestsForOwner(ownerId: string): Promise<ProjectAccessRequest[]>;
}
