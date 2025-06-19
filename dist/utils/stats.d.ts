import { Project } from "../entities/project.entity";
export interface DashboardStats {
    total_projects: number;
    active_projects: number;
    completed_projects: number;
    total_team_members: number;
    phase_statistics: {
        total_phases: number;
        completed_phases: number;
        in_progress_phases: number;
        total_budget: number;
        spent_budget: number;
    };
    monthly_growth: number;
    total_project_values: number;
    completion_rate: number;
}
export declare function calculateStatsFromProjects(projects: Project[]): DashboardStats;
