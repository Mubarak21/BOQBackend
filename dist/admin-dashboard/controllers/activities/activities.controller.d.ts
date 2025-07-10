import { ActivitiesService } from "../../../activities/activities.service";
export declare class AdminActivitiesController {
    private readonly activitiesService;
    constructor(activitiesService: ActivitiesService);
    listActivities(userId?: string, type?: string, dateFrom?: string, dateTo?: string, projectId?: string, search?: string, page?: number, limit?: number): Promise<{
        items: {
            id: string;
            type: import("../../../entities/activity.entity").ActivityType;
            description: string;
            user: {
                id: string;
                name: string;
                email: string;
            };
            project: {
                id: string;
                name: string;
            };
            timestamp: Date;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    getActivity(id: string): Promise<{
        id: string;
        type: import("../../../entities/activity.entity").ActivityType;
        description: string;
        user: {
            id: string;
            name: string;
            email: string;
        };
        project: {
            id: string;
            name: string;
        };
        timestamp: Date;
    }>;
}
