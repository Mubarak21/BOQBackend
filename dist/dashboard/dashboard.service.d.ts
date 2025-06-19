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
        total_projects: number;
        active_projects: number;
        completed_projects: number;
        total_team_members: number;
        phase_statistics: any;
        monthly_growth: number;
        total_project_values: number;
        completion_rate: number;
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
}
