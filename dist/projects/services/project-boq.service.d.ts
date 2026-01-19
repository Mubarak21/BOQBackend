import { Repository } from "typeorm";
import { Project } from "../../entities/project.entity";
import { Phase } from "../../entities/phase.entity";
import { BoqParserService } from "../boq-parser.service";
import { ActivitiesService } from "../../activities/activities.service";
import { ProjectsService } from "../projects.service";
import { ProjectPhaseService } from "./project-phase.service";
export interface ProcessBoqResult {
    message: string;
    totalAmount: number;
    tasks: any[];
}
export declare class ProjectBoqService {
    private readonly projectsRepository;
    private readonly phasesRepository;
    private readonly boqParserService;
    private readonly activitiesService;
    private readonly projectsService;
    private readonly projectPhaseService;
    constructor(projectsRepository: Repository<Project>, phasesRepository: Repository<Phase>, boqParserService: BoqParserService, activitiesService: ActivitiesService, projectsService: ProjectsService, projectPhaseService: ProjectPhaseService);
    processBoqFile(projectId: string, file: Express.Multer.File, userId: string): Promise<ProcessBoqResult>;
    processBoqFileFromParsedData(projectId: string, data: any[], totalAmount: number, userId: string, fileName?: string): Promise<ProcessBoqResult>;
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
}
