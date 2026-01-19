import { Repository } from "typeorm";
import { Phase } from "../../entities/phase.entity";
import { Project } from "../../entities/project.entity";
import { Task } from "../../entities/task.entity";
import { CreatePhaseDto } from "../dto/create-phase.dto";
import { UpdatePhaseDto } from "../dto/update-phase.dto";
import { UsersService } from "../../users/users.service";
import { ActivitiesService } from "../../activities/activities.service";
import { ProjectsService } from "../projects.service";
export declare class ProjectPhaseService {
    private readonly phasesRepository;
    private readonly projectsRepository;
    private readonly tasksRepository;
    private readonly usersService;
    private readonly activitiesService;
    private readonly projectsService;
    constructor(phasesRepository: Repository<Phase>, projectsRepository: Repository<Project>, tasksRepository: Repository<Task>, usersService: UsersService, activitiesService: ActivitiesService, projectsService: ProjectsService);
    createPhase(projectId: string, createPhaseDto: CreatePhaseDto, userId: string): Promise<Phase>;
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
    getBoqDraftPhases(projectId: string, userId: string): Promise<Phase[]>;
    activateBoqPhases(projectId: string, phaseIds: string[], userId: string): Promise<{
        activated: number;
        phases: Phase[];
    }>;
    createPhasesFromBoqData(data: any[], projectId: string, userId: string): Promise<Phase[]>;
}
