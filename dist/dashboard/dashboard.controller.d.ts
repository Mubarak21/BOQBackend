import { DashboardService } from "./dashboard.service";
import { ProjectsService } from "../projects/projects.service";
import { RequestWithUser } from "../auth/interfaces/request-with-user.interface";
export declare class DashboardController {
    private readonly dashboardService;
    private readonly projectsService;
    constructor(dashboardService: DashboardService, projectsService: ProjectsService);
    getStats(req: RequestWithUser): Promise<{
        totalProjects: number;
        activeProjects: number;
        completedProjects: number;
        totalValue: number;
        monthlyGrowth: number;
        teamMembers: number;
        phaseStats: {
            totalPhases: any;
            completedPhases: any;
            inProgressPhases: any;
            totalBudget: any;
            completionRate: any;
        };
        completion_rate: number;
        total_tasks: number;
        tasks_per_phase: number;
        average_phase_progress: number;
    }>;
    getMyProjects(req: RequestWithUser): Promise<any[]>;
    getRecentActivity(req: RequestWithUser, limit?: string): Promise<any[]>;
    getDashboardSummary(req: RequestWithUser): Promise<{
        stats: {
            total_projects: number;
            team_members: number;
            completion_rate: string;
            updated_at: string;
        };
        recentProjects: any[];
        totalProjects: number;
    }>;
    getNotifications(req: RequestWithUser, limit?: string): Promise<import("./dashboard.service").DashboardNotification[]>;
}
