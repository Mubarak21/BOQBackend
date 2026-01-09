import { Repository } from "typeorm";
import { Project } from "../../entities/project.entity";
import { Phase } from "../../entities/phase.entity";
export declare class ProjectDashboardService {
    private readonly projectsRepository;
    private readonly phasesRepository;
    constructor(projectsRepository: Repository<Project>, phasesRepository: Repository<Phase>);
    getDashboardProjectStats(): Promise<{
        total: number;
        active: number;
        completed: number;
        totalValue: number;
    }>;
    getDashboardPhaseStats(): Promise<{
        total: number;
        completed: number;
        inProgress: number;
        totalBudget: number;
        completionRate: number;
    }>;
    getDashboardTeamMembersCount(): Promise<number>;
    getDashboardMonthlyGrowth(): Promise<number>;
}
