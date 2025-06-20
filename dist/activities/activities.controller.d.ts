import { ActivitiesService } from "./activities.service";
export declare class ActivitiesController {
    private readonly activitiesService;
    constructor(activitiesService: ActivitiesService);
    getRecentActivities(limit?: string, offset?: string): Promise<import("../entities/activity.entity").Activity[]>;
    getProjectActivities(projectId: string, limit?: string, offset?: string): Promise<import("../entities/activity.entity").Activity[]>;
    getUserActivities(req: any, limit?: string, offset?: string): Promise<import("../entities/activity.entity").Activity[]>;
    getPhaseActivities(phaseId: string, limit?: string, offset?: string): Promise<import("../entities/activity.entity").Activity[]>;
}
