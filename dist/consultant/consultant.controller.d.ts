import { ProjectsService } from "../projects/projects.service";
import { CommentsService } from "../comments/comments.service";
import { RequestWithUser } from "../auth/interfaces/request-with-user.interface";
export declare class ConsultantController {
    private readonly projectsService;
    private readonly commentsService;
    constructor(projectsService: ProjectsService, commentsService: CommentsService);
    getAllProjects(req: RequestWithUser): Promise<any[]>;
    getProjectDetails(id: string, req: RequestWithUser): Promise<any>;
    getProjectPhases(id: string, page: number, limit: number, req: RequestWithUser): Promise<{
        items: {
            id: string;
            title: string;
            description: string;
            start_date: Date;
            end_date: Date;
            progress: number;
            status: import("../entities/phase.entity").PhaseStatus;
            created_at: Date;
            updated_at: Date;
            subPhases: {
                id: string;
                title: string;
                description: string;
                isCompleted: boolean;
            }[];
        }[];
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
