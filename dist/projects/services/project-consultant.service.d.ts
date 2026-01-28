import { Repository } from "typeorm";
import { Project } from "../../entities/project.entity";
import { Phase } from "../../entities/phase.entity";
import { ProjectsService } from "../projects.service";
export declare class ProjectConsultantService {
    private readonly projectsRepository;
    private readonly phasesRepository;
    private readonly projectsService;
    constructor(projectsRepository: Repository<Project>, phasesRepository: Repository<Phase>, projectsService: ProjectsService);
    getAllConsultantProjects(): Promise<any[]>;
    getAllConsultantProjectsPaginated(userId: string, page?: number, limit?: number, search?: string, status?: string): Promise<{
        items: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getConsultantProjectDetails(id: string): Promise<any>;
    getConsultantProjectPhases(projectId: string): Promise<any[]>;
    getConsultantProjectPhasesPaginated(projectId: string, page?: number, limit?: number): Promise<{
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
}
