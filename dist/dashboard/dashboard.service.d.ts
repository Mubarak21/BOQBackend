import { Repository } from "typeorm";
import { Project } from "../entities/project.entity";
import { User } from "../entities/user.entity";
import { Task } from "../entities/task.entity";
export declare class DashboardService {
    private projectsRepository;
    private usersRepository;
    private tasksRepository;
    constructor(projectsRepository: Repository<Project>, usersRepository: Repository<User>, tasksRepository: Repository<Task>);
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
            spentBudget: any;
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
    private getPhasePriorityBreakdown;
    private getAveragePhaseProgress;
}
