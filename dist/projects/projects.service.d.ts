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
export declare class ProjectsService {
    private projectsRepository;
    private tasksRepository;
    private usersService;
    private activitiesService;
    constructor(projectsRepository: Repository<Project>, tasksRepository: Repository<Task>, usersService: UsersService, activitiesService: ActivitiesService);
    findAll(userId: string): Promise<Project[]>;
    findOne(id: string, userId?: string): Promise<Project>;
    create(createProjectDto: CreateProjectDto, owner: User): Promise<Project>;
    update(id: string, updateProjectDto: UpdateProjectDto, userId: string): Promise<Project>;
    remove(id: string, userId: string): Promise<void>;
    addCollaborator(projectId: string, collaborator: User, userId: string): Promise<Project>;
    removeCollaborator(projectId: string, collaboratorId: string, userId: string): Promise<Project>;
    private parseAmount;
    processBoqFile(projectId: string, file: Express.Multer.File, userId: string): Promise<{
        message: string;
        totalAmount: number;
        tasks: Task[];
    }>;
    createPhase(projectId: string, createPhaseDto: CreatePhaseDto, userId: string): Promise<Task>;
    getProjectPhases(projectId: string, userId: string): Promise<Task[]>;
    getAvailableAssignees(): Promise<User[]>;
    updatePhase(projectId: string, phaseId: string, updatePhaseDto: UpdatePhaseDto, userId: string): Promise<Task>;
    deletePhase(projectId: string, phaseId: string, userId: string): Promise<void>;
}
