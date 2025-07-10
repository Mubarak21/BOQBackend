import { ProjectsService } from "../../../projects/projects.service";
import { UsersService } from "../../../users/users.service";
import { ActivitiesService } from "../../../activities/activities.service";
import { UserRole } from "../../../entities/user.entity";
export declare class AdminDashboardController {
    private readonly projectsService;
    private readonly usersService;
    private readonly activitiesService;
    constructor(projectsService: ProjectsService, usersService: UsersService, activitiesService: ActivitiesService);
    getMetrics(): Promise<{
        totalProjects: number;
        totalUsers: number;
        totalActivities: number;
    }>;
    getRecentActivities(limit?: number): Promise<import("../../../entities/activity.entity").Activity[]>;
    getTrends(metric?: string, period?: string): Promise<any[] | {
        error: string;
    }>;
    getTopUsers(limit?: number): Promise<{
        id: string;
        name: string;
        email: string;
        role: UserRole;
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
