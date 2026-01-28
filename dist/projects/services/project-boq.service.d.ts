import { Repository, DataSource } from "typeorm";
import { Project } from "../../entities/project.entity";
import { Phase } from "../../entities/phase.entity";
import { ProjectBoq } from "../../entities/project-boq.entity";
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
    private readonly projectBoqRepository;
    private readonly boqParserService;
    private readonly activitiesService;
    private readonly projectsService;
    private readonly projectPhaseService;
    private readonly dataSource;
    constructor(projectsRepository: Repository<Project>, phasesRepository: Repository<Phase>, projectBoqRepository: Repository<ProjectBoq>, boqParserService: BoqParserService, activitiesService: ActivitiesService, projectsService: ProjectsService, projectPhaseService: ProjectPhaseService, dataSource: DataSource);
    processBoqFile(projectId: string, file: Express.Multer.File, userId: string): Promise<ProcessBoqResult>;
    processBoqFileFromParsedData(projectId: string, data: any[], totalAmount: number, userId: string, fileName?: string, file?: Express.Multer.File, type?: 'contractor' | 'sub_contractor'): Promise<ProcessBoqResult>;
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
    getMissingBoqItems(projectId: string, userId: string, boqType?: 'contractor' | 'sub_contractor'): Promise<{
        items: Array<{
            description: string;
            unit: string;
            quantity: number;
            rate: number;
            amount: number;
            section?: string;
            subSection?: string;
            rowIndex: number;
        }>;
        totalAmount: number;
    }>;
}
