import { Repository } from "typeorm";
import { Project } from "../entities/project.entity";
import { User } from "../entities/user.entity";
import { Task } from "../entities/task.entity";
import { Stats } from "../entities/stats.entity";
export declare class DashboardService {
    private projectsRepository;
    private usersRepository;
    private tasksRepository;
    private readonly statsRepository;
    constructor(projectsRepository: Repository<Project>, usersRepository: Repository<User>, tasksRepository: Repository<Task>, statsRepository: Repository<Stats>);
    getStats(userId: string): Promise<{
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
    }>;
    updateStats(): Promise<Stats>;
    getStatsFromTable(): Promise<Stats | {
        total_projects: number;
        total_value: string;
        team_members: number;
        updated_at: any;
    }>;
    getUserStatsForDashboard(userId: string): Promise<{
        total_projects: number;
        team_members: number;
        completion_rate: string;
        updated_at: string;
    }>;
    private getTotalProjects;
    private getActiveProjects;
    private getCompletedProjects;
    private getTotalTeamMembers;
    private getPhaseStats;
    private getMonthlyGrowth;
    private getTotalProjectValues;
    getProjectProgress(project: Project): Promise<{
        totalPhases: number;
        completedPhases: number;
        progress: number;
    }>;
    getProjectBudget(project: Project): Promise<{
        totalBudget: number;
        spent: number;
        remaining: number;
    }>;
    private getTaskStats;
    private getAveragePhaseProgress;
}
