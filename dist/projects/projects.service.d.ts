import { Repository } from "typeorm";
import { Project, ProjectStatus, ProjectPriority } from "../entities/project.entity";
import { User } from "../entities/user.entity";
import { Task } from "../entities/task.entity";
import { CreateProjectDto } from "./dto/create-project.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";
import { ActivitiesService } from "../activities/activities.service";
import { UsersService } from "../users/users.service";
import { CreatePhaseDto } from "./dto/create-phase.dto";
import { UpdatePhaseDto } from "./dto/update-phase.dto";
import { Phase } from "../entities/phase.entity";
import { TasksService } from "../tasks/tasks.service";
import { ProjectAccessRequest } from "../entities/project-access-request.entity";
import { DashboardService } from "../dashboard/dashboard.service";
export interface ProcessBoqResult {
    message: string;
    totalAmount: number;
    tasks: Task[];
}
export declare class ProjectsService {
    private readonly projectsRepository;
    private readonly tasksRepository;
    private readonly phasesRepository;
    private readonly accessRequestRepository;
    private readonly usersService;
    private readonly activitiesService;
    private readonly tasksService;
    private readonly dashboardService;
    constructor(projectsRepository: Repository<Project>, tasksRepository: Repository<Task>, phasesRepository: Repository<Phase>, accessRequestRepository: Repository<ProjectAccessRequest>, usersService: UsersService, activitiesService: ActivitiesService, tasksService: TasksService, dashboardService: DashboardService);
    findAll(): Promise<Project[]>;
    findOne(id: string, userId?: string): Promise<Project>;
    create(createProjectDto: CreateProjectDto, owner: User): Promise<Project>;
    update(id: string, updateProjectDto: UpdateProjectDto, userId: string): Promise<Project>;
    remove(id: string, userId: string): Promise<void>;
    addCollaborator(projectId: string, collaborator: User, userId: string): Promise<Project>;
    removeCollaborator(projectId: string, collaboratorId: string, userId: string): Promise<Project>;
    processBoqFile(projectId: string, file: Express.Multer.File, userId: string): Promise<ProcessBoqResult>;
    createPhase(projectId: string, createPhaseDto: CreatePhaseDto, userId: string): Promise<Phase>;
    updatePhase(projectId: string, phaseId: string, updatePhaseDto: UpdatePhaseDto, userId: string): Promise<Phase>;
    deletePhase(projectId: string, phaseId: string, userId: string): Promise<void>;
    getProjectPhases(projectId: string, userId: string): Promise<Phase[]>;
    getAvailableAssignees(projectId: string): Promise<User[]>;
    getProjectResponse(project: Project): Promise<any>;
    findAllProjects(): Promise<Project[]>;
    joinProject(projectId: string, user: User): Promise<Project>;
    createJoinRequest(projectId: string, requesterId: string): Promise<ProjectAccessRequest>;
    listJoinRequestsForProject(projectId: string, ownerId: string): Promise<ProjectAccessRequest[]>;
    approveJoinRequest(projectId: string, requestId: string, ownerId: string): Promise<ProjectAccessRequest>;
    denyJoinRequest(projectId: string, requestId: string, ownerId: string): Promise<ProjectAccessRequest>;
    listMyJoinRequests(userId: string): Promise<ProjectAccessRequest[]>;
    listJoinRequestsForOwner(ownerId: string): Promise<ProjectAccessRequest[]>;
    getAvailablePhaseTasks(projectId: string, userId: string): Promise<Task[]>;
    countAll(): Promise<number>;
    getTrends(period?: string, from?: string, to?: string): Promise<any[]>;
    adminList({ search, status, page, limit }: {
        search?: string;
        status: any;
        page?: number;
        limit?: number;
    }): Promise<{
        items: {
            id: string;
            name: string;
            description: string;
            status: ProjectStatus;
            createdAt: Date;
            updatedAt: Date;
            owner: {
                id: string;
                display_name: string;
            };
            members: {
                id: string;
                display_name: string;
            }[];
            tags: string[];
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    adminGetDetails(id: string): Promise<{
        id: string;
        name: string;
        description: string;
        status: ProjectStatus;
        createdAt: Date;
        updatedAt: Date;
        owner: {
            id: string;
            display_name: string;
        };
        members: {
            id: string;
            display_name: string;
        }[];
        tags: string[];
        phases: Phase[];
    }>;
    getTopActiveProjects(limit?: number): Promise<{
        id: string;
        name: string;
        description: string;
        status: ProjectStatus;
        createdAt: Date;
        owner: {
            id: string;
            display_name: string;
        };
        members: {
            id: string;
            display_name: string;
        }[];
    }[]>;
    getGroupedByStatus(): Promise<any[]>;
    private hasProjectAccess;
    private getValidatedCollaborators;
    private parseAmount;
    private parseBoqFile;
    private getColumnMappings;
    private createTasksFromBoqData;
    private createTasksRecursive;
    getConsultantProjectSummary(project: Project): {
        id: string;
        title: string;
        description: string;
        status: ProjectStatus;
        priority: ProjectPriority;
        start_date: Date;
        end_date: Date;
        totalAmount: number;
        tags: string[];
        created_at: Date;
        updated_at: Date;
        department: {
            id: string;
            name: string;
        };
    };
    getAllConsultantProjects(): Promise<any[]>;
    getConsultantProjectDetails(id: string): Promise<any>;
    getConsultantProjectPhases(projectId: string): Promise<any[]>;
    getConsultantProjectTasks(projectId: string): Promise<any[]>;
}
