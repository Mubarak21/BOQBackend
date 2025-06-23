import { ProjectsService, ProcessBoqResult } from "./projects.service";
import { CreateProjectDto } from "./dto/create-project.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";
import { UsersService } from "../users/users.service";
import { RequestWithUser } from "../auth/interfaces/request-with-user.interface";
import { CreatePhaseDto } from "./dto/create-phase.dto";
import { UpdatePhaseDto } from "./dto/update-phase.dto";
import { Phase } from "../entities/phase.entity";
import { CollaborationRequest } from "../entities/collaboration-request.entity";
import { Repository } from "typeorm";
export declare class ProjectsController {
    private readonly projectsService;
    private readonly usersService;
    private readonly collaborationRequestRepository;
    constructor(projectsService: ProjectsService, usersService: UsersService, collaborationRequestRepository: Repository<CollaborationRequest>);
    create(createProjectDto: CreateProjectDto, req: any): Promise<import("../entities/project.entity").Project>;
    findAll(req: any): Promise<import("./dto/project-response.dto").ProjectResponseDto[]>;
    findOne(id: string, req: RequestWithUser): Promise<import("./dto/project-response.dto").ProjectResponseDto | import("./dto/project-response.dto").PublicProjectResponseDto>;
    update(id: string, updateProjectDto: UpdateProjectDto, req: any): Promise<import("../entities/project.entity").Project>;
    remove(id: string, req: any): Promise<void>;
    addCollaborator(id: string, userId: string, req: any): Promise<import("../entities/project.entity").Project>;
    removeCollaborator(id: string, userId: string, req: any): Promise<import("../entities/project.entity").Project>;
    inviteCollaborator(id: string, userId: string, req: any): Promise<{
        message: string;
    }>;
    uploadBoq(id: string, file: Express.Multer.File, req: RequestWithUser): Promise<ProcessBoqResult>;
    createPhase(id: string, createPhaseDto: CreatePhaseDto, req: RequestWithUser): Promise<Phase>;
    getProjectPhases(id: string, req: RequestWithUser): Promise<Phase[]>;
    getAvailableAssignees(req: any): Promise<import("../entities/user.entity").User[]>;
    updatePhase(projectId: string, phaseId: string, updatePhaseDto: UpdatePhaseDto, req: RequestWithUser): Promise<Phase>;
    deletePhase(projectId: string, phaseId: string, req: RequestWithUser): Promise<{
        message: string;
    }>;
    joinProject(id: string, req: any): Promise<import("../entities/project.entity").Project>;
    findAllProjects(): Promise<import("../entities/project.entity").Project[]>;
}
