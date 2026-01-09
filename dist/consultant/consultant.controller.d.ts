import { ProjectsService } from "../projects/projects.service";
import { CommentsService } from "../comments/comments.service";
import { RequestWithUser } from "../auth/interfaces/request-with-user.interface";
export declare class ConsultantController {
    private readonly projectsService;
    private readonly commentsService;
    constructor(projectsService: ProjectsService, commentsService: CommentsService);
    getAllProjects(req: RequestWithUser, page?: number, limit?: number, search?: string, status?: string): Promise<{
        items: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getProjectDetails(id: string, req: RequestWithUser): Promise<any>;
    getProjectPhases(id: string, page: number, limit: number, req: RequestWithUser): Promise<{
        items: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getProjectTasks(projectId: string, req: RequestWithUser): Promise<any[]>;
    getProjectFeedback(projectId: string, req: RequestWithUser): Promise<any[]>;
    createFeedback(body: {
        projectId: string;
        content: string;
    }, req: RequestWithUser): Promise<any>;
}
