import { ProjectsService } from "../../../projects/projects.service";
import { UsersService } from "../../../users/users.service";
import { ActivitiesService } from "../../../activities/activities.service";
export declare class AdminAnalyticsController {
    private readonly projectsService;
    private readonly usersService;
    private readonly activitiesService;
    constructor(projectsService: ProjectsService, usersService: UsersService, activitiesService: ActivitiesService);
    projectsCreated(period?: string, from?: string, to?: string): Promise<any[]>;
    usersCreated(period?: string, from?: string, to?: string): Promise<any[]>;
    activitiesLogged(period?: string, from?: string, to?: string): Promise<any[]>;
    projectsByStatus(): Promise<{
        status: any;
        count: number;
        percentage: number;
    }[]>;
    usersByRole(): Promise<{
        role: any;
        count: number;
        percentage: number;
    }[]>;
    userGrowth(compare?: string): Promise<{
        current: number;
        previous: number;
        growth: number;
    }>;
    projectCompletion(period?: string, from?: string, to?: string): Promise<{
        date: any;
        completed: number;
        total: number;
        completionRate: number;
    }[]>;
    userEngagement(period?: string, from?: string, to?: string): Promise<any[]>;
}
