import { ProjectsService } from "../../../projects/projects.service";
import { ProjectDashboardService } from "../../../projects/services/project-dashboard.service";
import { UsersService } from "../../../users/users.service";
import { ActivitiesService } from "../../../activities/activities.service";
import { RequestWithUser } from "../../../auth/interfaces/request-with-user.interface";
export declare class AdminDashboardController {
    private readonly projectsService;
    private readonly projectDashboardService;
    private readonly usersService;
    private readonly activitiesService;
    constructor(projectsService: ProjectsService, projectDashboardService: ProjectDashboardService, usersService: UsersService, activitiesService: ActivitiesService);
    getMetrics(): Promise<{
        totalProjects: number;
        totalUsers: number;
        totalActivities: number;
    }>;
    getStats(req: RequestWithUser): Promise<{
        totalProjects: number;
        activeProjects: number;
        completedProjects: number;
        totalValue: number;
        monthlyGrowth: number;
        teamMembers: number;
        phaseStats: {
            totalPhases: number;
            completedPhases: number;
            inProgressPhases: number;
            totalBudget: number;
            completionRate: number;
        };
    }>;
    getRecentActivities(limit?: number): Promise<import("../../../entities/activity.entity").Activity[]>;
    getTrends(metric?: string, period?: string, from?: string, to?: string): Promise<any[] | {
        error: string;
    }>;
    getTopUsers(limit?: number): Promise<{
        id: string;
        name: string;
        email: string;
        role: import("../../../entities/user.entity").UserRole;
        createdAt: Date;
    }[]>;
    getTopProjects(limit?: number): Promise<{
        id: string;
        name: string;
        description: string;
        status: import("../../../entities/project.entity").ProjectStatus;
        createdAt: Date;
        owner: {
            id: string;
            display_name: string;
        };
        members: {
            id: string;
            display_name: string;
        }[];
    }[]>;
}
