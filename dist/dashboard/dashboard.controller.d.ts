import { DashboardService } from "./dashboard.service";
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getStats(req: any): Promise<{
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
        };
        completion_rate: number;
        total_tasks: number;
        tasks_per_phase: number;
        average_phase_progress: number;
        phase_priority_breakdown: {
            low: number;
            medium: number;
            high: number;
            urgent: number;
            none: number;
        };
    }>;
}
