import { Repository, DataSource } from "typeorm";
import { Phase } from "../../entities/phase.entity";
import { ContractorPhase } from "../../entities/contractor-phase.entity";
import { SubContractorPhase } from "../../entities/sub-contractor-phase.entity";
import { Project } from "../../entities/project.entity";
import { Task } from "../../entities/task.entity";
import { CreatePhaseDto } from "../dto/create-phase.dto";
import { UpdatePhaseDto } from "../dto/update-phase.dto";
import { UsersService } from "../../users/users.service";
import { ActivitiesService } from "../../activities/activities.service";
import { ProjectsService } from "../projects.service";
export declare class ProjectPhaseService {
    private readonly phasesRepository;
    private readonly contractorPhasesRepository;
    private readonly subContractorPhasesRepository;
    private readonly projectsRepository;
    private readonly tasksRepository;
    private readonly usersService;
    private readonly activitiesService;
    private readonly projectsService;
    private readonly dataSource;
    constructor(phasesRepository: Repository<Phase>, contractorPhasesRepository: Repository<ContractorPhase>, subContractorPhasesRepository: Repository<SubContractorPhase>, projectsRepository: Repository<Project>, tasksRepository: Repository<Task>, usersService: UsersService, activitiesService: ActivitiesService, projectsService: ProjectsService, dataSource: DataSource);
    createPhase(projectId: string, createPhaseDto: CreatePhaseDto, userId: string): Promise<Phase>;
    private normalizePhaseResponse;
    updatePhase(projectId: string, phaseId: string, updatePhaseDto: UpdatePhaseDto, userId: string): Promise<Phase>;
    deletePhase(projectId: string, phaseId: string, userId: string): Promise<void>;
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
    getBoqDraftPhases(projectId: string, userId: string): Promise<any[]>;
    activateBoqPhases(projectId: string, phaseIds: string[], userId: string, linkedContractorPhaseId?: string): Promise<{
        activated: number;
        phases: any[];
    }>;
    createPhasesFromBoqData(data: any[], projectId: string, userId: string, boqType?: 'contractor' | 'sub_contractor'): Promise<ContractorPhase[] | SubContractorPhase[]>;
}
