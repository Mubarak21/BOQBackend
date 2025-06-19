import { ProjectsService } from "./projects.service";
import { CreateProjectDto } from "./dto/create-project.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";
import { UsersService } from "../users/users.service";
import { RequestWithUser } from "../auth/interfaces/request-with-user.interface";
import { CreatePhaseDto } from "./dto/create-phase.dto";
import { UpdatePhaseDto } from "./dto/update-phase.dto";
export declare class ProjectsController {
    private readonly projectsService;
    private readonly usersService;
    constructor(projectsService: ProjectsService, usersService: UsersService);
    create(createProjectDto: CreateProjectDto, req: any): Promise<import("../entities/project.entity").Project>;
    findAll(req: any): Promise<import("../entities/project.entity").Project[]>;
    findOne(id: string, req: RequestWithUser): Promise<import("../entities/project.entity").Project>;
    update(id: string, updateProjectDto: UpdateProjectDto, req: any): Promise<import("../entities/project.entity").Project>;
    remove(id: string, req: any): Promise<void>;
    addCollaborator(id: string, userId: string, req: any): Promise<import("../entities/project.entity").Project>;
    removeCollaborator(id: string, userId: string, req: any): Promise<import("../entities/project.entity").Project>;
    uploadBoq(id: string, file: Express.Multer.File, req: RequestWithUser): Promise<{
        message: string;
        totalAmount: number;
        tasks: import("../entities/task.entity").Task[];
    }>;
    createPhase(id: string, createPhaseDto: CreatePhaseDto, req: RequestWithUser): Promise<import("../entities/task.entity").Task>;
    getProjectPhases(id: string, req: RequestWithUser): Promise<import("../entities/task.entity").Task[]>;
    getAvailableAssignees(): Promise<import("../entities/user.entity").User[]>;
    updatePhase(projectId: string, phaseId: string, updatePhaseDto: UpdatePhaseDto, req: RequestWithUser): Promise<import("../entities/task.entity").Task>;
    deletePhase(projectId: string, phaseId: string, req: RequestWithUser): Promise<{
        message: string;
    }>;
}
