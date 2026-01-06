import { ProjectsService } from "../../../projects/projects.service";
import { CreateProjectDto } from "../../../projects/dto/create-project.dto";
import { UpdateProjectDto } from "../../../projects/dto/update-project.dto";
export declare class AdminProjectsController {
    private readonly projectsService;
    constructor(projectsService: ProjectsService);
    listProjects(search?: string, status?: string, page?: number, limit?: number): Promise<{
        items: {
            id: string;
            name: string;
            description: string;
            status: import("../../../entities/project.entity").ProjectStatus;
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
    getProject(id: string): Promise<any>;
    createProject(createProjectDto: CreateProjectDto, req: any): Promise<import("../../../entities/project.entity").Project>;
    updateProject(id: string, updateProjectDto: UpdateProjectDto, req: any): Promise<import("../../../entities/project.entity").Project>;
    deleteProject(id: string, req: any): Promise<void>;
}
