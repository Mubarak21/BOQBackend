import { ProjectsService } from "../../../projects/projects.service";
import { UsersService } from "../../../users/users.service";
import { ActivitiesService } from "../../../activities/activities.service";
export declare class AdminAnalyticsController {
    private readonly projectsService;
    private readonly usersService;
    private readonly activitiesService;
    constructor(projectsService: ProjectsService, usersService: UsersService, activitiesService: ActivitiesService);
    projectsCreated(period?: string, from?: string, to?: string): Promise<any[]>;
    userSignups(period?: string, from?: string, to?: string): Promise<any[]>;
    activities(period?: string, from?: string, to?: string): Promise<any[]>;
    projectsByStatus(): Promise<any[]>;
    usersByRole(): Promise<any[]>;
    userGrowth(compare?: string): Promise<{
        current: number;
        previous: number;
        growth: number;
    }>;
}
