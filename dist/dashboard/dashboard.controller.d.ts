import { DashboardService } from "./dashboard.service";
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getStats(req: any): Promise<{
        total_projects: number;
        active_projects: number;
        completed_projects: number;
        total_team_members: number;
        phase_statistics: any;
        monthly_growth: number;
        total_project_values: number;
        completion_rate: number;
    }>;
}
