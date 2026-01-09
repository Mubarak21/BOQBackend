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
import { BoqParserService } from "./boq-parser.service";
import { Inventory } from "../entities/inventory.entity";
import { InventoryUsage } from "../entities/inventory-usage.entity";
import { ProjectDashboardService } from "./services/project-dashboard.service";
import { ProjectConsultantService } from "./services/project-consultant.service";
import { ProjectContractorService } from "./services/project-contractor.service";
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
    private readonly inventoryRepository;
    private readonly inventoryUsageRepository;
    private readonly usersService;
    private readonly activitiesService;
    private readonly tasksService;
    private readonly dashboardService;
    private readonly boqParserService;
    private readonly projectDashboardService;
    private readonly projectConsultantService;
    private readonly projectContractorService;
    constructor(projectsRepository: Repository<Project>, tasksRepository: Repository<Task>, phasesRepository: Repository<Phase>, accessRequestRepository: Repository<ProjectAccessRequest>, inventoryRepository: Repository<Inventory>, inventoryUsageRepository: Repository<InventoryUsage>, usersService: UsersService, activitiesService: ActivitiesService, tasksService: TasksService, dashboardService: DashboardService, boqParserService: BoqParserService, projectDashboardService: ProjectDashboardService, projectConsultantService: ProjectConsultantService, projectContractorService: ProjectContractorService);
    findAll(): Promise<Project[]>;
    findAllPaginated({ page, limit, search, status, }: {
        page?: number;
        limit?: number;
        search?: string;
        status?: string;
    }): Promise<{
        items: Project[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findUserProjects(userId: string): Promise<Project[]>;
    findUserProjectsPaginated(userId: string, { page, limit, search, status, }: {
        page?: number;
        limit?: number;
        search?: string;
        status?: string;
    }): Promise<{
        items: Project[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string, userId?: string): Promise<Project>;
    create(createProjectDto: CreateProjectDto, owner: User): Promise<Project>;
    update(id: string, updateProjectDto: UpdateProjectDto, userId: string): Promise<Project>;
    remove(id: string, userId: string): Promise<void>;
    addCollaborator(projectId: string, collaborator: User, userId: string): Promise<Project>;
    removeCollaborator(projectId: string, collaboratorId: string, userId: string): Promise<Project>;
    processBoqFile(projectId: string, file: Express.Multer.File, userId: string): Promise<ProcessBoqResult>;
    processBoqFileFromParsedData(projectId: string, data: any[], totalAmount: number, userId: string, fileName?: string): Promise<ProcessBoqResult>;
    createPhase(projectId: string, createPhaseDto: CreatePhaseDto, userId: string): Promise<Phase>;
    updatePhase(projectId: string, phaseId: string, updatePhaseDto: UpdatePhaseDto, userId: string): Promise<Phase>;
    deletePhase(projectId: string, phaseId: string, userId: string): Promise<void>;
    getProjectPhases(projectId: string, userId: string): Promise<Phase[]>;
    getProjectPhasesPaginated(projectId: string, userId: string, { page, limit }: {
        page?: number;
        limit?: number;
    }): Promise<{
        items: Phase[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
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
            progress: number;
            completedPhases: number;
            totalPhases: number;
            totalAmount: number;
            totalBudget: number;
            startDate: Date;
            estimatedCompletion: Date;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findAllForAdmin(): Promise<Project[]>;
    adminGetDetails(id: string): Promise<any>;
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
    getGroupedByStatus(): Promise<{
        status: any;
        count: number;
        percentage: number;
    }[]>;
    private hasProjectAccess;
    private getValidatedCollaborators;
    private parseAmountValue;
    private validateAndNormalizeProjectAmount;
    private parseBoqFile;
    private parseCsvLine;
    private detectHierarchicalStructure;
    private standardizeNumber;
    private getColumnMappingsFromHeaders;
    private getColumnMappings;
    private createPhasesFromBoqData;
    private createPhasesFromBoqData_OLD;
    private createTasksFromBoqData;
    previewBoqFile(file: Express.Multer.File): Promise<{
        phases: Array<{
            title: string;
            description: string;
            budget: number;
            unit?: string;
            quantity?: number;
            rate?: number;
            mainSection?: string;
            subSection?: string;
        }>;
        totalAmount: number;
        totalPhases: number;
    }>;
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
    getAllConsultantProjectsPaginated(page?: number, limit?: number, search?: string, status?: string): Promise<{
        items: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getConsultantProjectDetails(id: string): Promise<any>;
    getConsultantProjectPhases(projectId: string): Promise<any[]>;
    getConsultantProjectPhasesPaginated(projectId: string, { page, limit }: {
        page?: number;
        limit?: number;
    }): Promise<{
        items: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getBoqDraftPhases(projectId: string, userId: string): Promise<Phase[]>;
    activateBoqPhases(projectId: string, phaseIds: string[], userId: string): Promise<{
        activated: number;
        phases: Phase[];
    }>;
    getConsultantProjectTasks(projectId: string): Promise<any[]>;
    getProjectCompletionTrends(period?: string, from?: string, to?: string): Promise<{
        date: any;
        completed: number;
        total: number;
        completionRate: number;
    }[]>;
    getProjectInventory(projectId: string, userId: string, options: {
        page?: number;
        limit?: number;
        category?: string;
        search?: string;
    }): Promise<{
        items: Inventory[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    addProjectInventoryItem(projectId: string, createInventoryDto: any, userId: string, pictureFile?: Express.Multer.File): Promise<Inventory>;
    updateProjectInventoryItem(projectId: string, inventoryId: string, updateData: any, userId: string): Promise<Inventory>;
    deleteProjectInventoryItem(projectId: string, inventoryId: string, userId: string): Promise<{
        message: string;
    }>;
    recordInventoryUsage(projectId: string, inventoryId: string, quantity: number, userId: string, phaseId?: string, notes?: string): Promise<InventoryUsage>;
    getInventoryUsageHistory(projectId: string, inventoryId: string, userId: string, options: {
        page?: number;
        limit?: number;
    }): Promise<{
        items: InventoryUsage[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getProjectInventoryUsage(projectId: string, userId: string, options: {
        page?: number;
        limit?: number;
    }): Promise<{
        items: InventoryUsage[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    linkInventoryToProject(inventoryId: string, projectId: string, userId: string): Promise<Inventory>;
    unlinkInventoryFromProject(inventoryId: string, projectId: string, userId: string): Promise<Inventory>;
    getDashboardProjectStats(): Promise<{
        total: number;
        active: number;
        completed: number;
        totalValue: number;
    }>;
    getDashboardPhaseStats(): Promise<{
        total: number;
        completed: number;
        inProgress: number;
        totalBudget: number;
        completionRate: number;
    }>;
    getDashboardTeamMembersCount(): Promise<number>;
    getDashboardMonthlyGrowth(): Promise<number>;
}
