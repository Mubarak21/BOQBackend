import { ActivitiesService } from "./activities.service";
export declare class ActivitiesController {
    private readonly activitiesService;
    constructor(activitiesService: ActivitiesService);
    getRecentActivities(limit?: number, offset?: number): Promise<import("../entities/activity.entity").Activity[]>;
    getProjectActivities(projectId: string, limit?: number, offset?: number): Promise<import("../entities/activity.entity").Activity[]>;
    getUserActivities(req: any, limit?: number, offset?: number): Promise<import("../entities/activity.entity").Activity[]>;
}
