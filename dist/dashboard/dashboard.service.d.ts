import { Repository } from "typeorm";
import { Project } from "../entities/project.entity";
import { User } from "../entities/user.entity";
import { Task } from "../entities/task.entity";
import { Stats } from "../entities/stats.entity";
import { Comment } from "../entities/comment.entity";
import { Penalty } from "../entities/penalty.entity";
import { Complaint } from "../entities/complaint.entity";
import { Accident } from "../entities/accident.entity";
import { DailyAttendance } from "../entities/daily-attendance.entity";
import { PhaseEvidence } from "../entities/phase-evidence.entity";
import { ProjectsService } from "../projects/projects.service";
export interface DashboardNotification {
    id: string;
    type: "feedback" | "penalty" | "complaint" | "accident" | "attendance" | "evidence";
    title: string;
    message: string;
    projectId: string;
    projectName: string;
    createdAt: string;
}
export declare class DashboardService {
    private projectsRepository;
    private usersRepository;
    private tasksRepository;
    private readonly statsRepository;
    private readonly commentsRepository;
    private readonly penaltiesRepository;
    private readonly complaintsRepository;
    private readonly accidentsRepository;
    private readonly dailyAttendanceRepository;
    private readonly phaseEvidenceRepository;
    private readonly projectsService;
    constructor(projectsRepository: Repository<Project>, usersRepository: Repository<User>, tasksRepository: Repository<Task>, statsRepository: Repository<Stats>, commentsRepository: Repository<Comment>, penaltiesRepository: Repository<Penalty>, complaintsRepository: Repository<Complaint>, accidentsRepository: Repository<Accident>, dailyAttendanceRepository: Repository<DailyAttendance>, phaseEvidenceRepository: Repository<PhaseEvidence>, projectsService: ProjectsService);
    getStats(userId: string, userRole?: string): Promise<{
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
            completionRate: any;
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
    getUserStatsForDashboard(userId: string, userRole?: string): Promise<{
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
    getNotifications(userId: string, limit?: number, userRole?: string): Promise<DashboardNotification[]>;
}
