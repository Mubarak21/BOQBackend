import { Repository } from "typeorm";
import { Project } from "../entities/project.entity";
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
export interface ProcessBoqResult {
    message: string;
    totalAmount: number;
    tasks: Task[];
}
export declare class ProjectsService {
    private readonly projectsRepository;
    private readonly tasksRepository;
    private readonly phasesRepository;
    private readonly usersService;
    private readonly activitiesService;
    private readonly tasksService;
    constructor(projectsRepository: Repository<Project>, tasksRepository: Repository<Task>, phasesRepository: Repository<Phase>, usersService: UsersService, activitiesService: ActivitiesService, tasksService: TasksService);
    findAll(userId: string): Promise<Project[]>;
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
    private hasProjectAccess;
    private getValidatedCollaborators;
    private validateAssignee;
    private parseAmount;
    private parseBoqFile;
    private getColumnMappings;
    private createTasksFromBoqData;
    private createTasksRecursive;
}
