import { Repository } from "typeorm";
import { Activity, ActivityType } from "../entities/activity.entity";
import { User } from "../entities/user.entity";
import { Project } from "../entities/project.entity";
import { Task } from "../entities/task.entity";
import { Phase } from "../entities/phase.entity";
import { ProjectsService } from "../projects/projects.service";
export declare class ActivitiesService {
    private activitiesRepository;
    private readonly projectsService;
    constructor(activitiesRepository: Repository<Activity>, projectsService: ProjectsService);
    createActivity(type: ActivityType, description: string, user: User, project: Project, phaseOrTask: Phase | Task | null, metadata?: any): Promise<Activity>;
    getProjectActivities(projectId: string, limit?: number, offset?: number): Promise<Activity[]>;
    getUserActivities(userId: string, limit?: number, offset?: number): Promise<Activity[]>;
    getRecentActivities(limit?: number, offset?: number): Promise<Activity[]>;
    countAll(): Promise<number>;
    logBoqUploaded(user: User, project: Project, filename: string, totalPhases: number, totalAmount: number): Promise<Activity>;
    logPhaseCreated(user: User, project: Project, phase: Phase, phaseNumber: number, totalPhases: number): Promise<Activity>;
    logPhaseCompleted(user: User, project: Project, phase: Phase, phaseNumber: number, totalPhases: number): Promise<Activity>;
    logPhaseProgress(user: User, project: Project, phase: Phase, phaseNumber: number, totalPhases: number, progress: number): Promise<Activity>;
    logPhaseDelay(user: User, project: Project, phase: Phase, phaseNumber: number, totalPhases: number, delayDays: number): Promise<Activity>;
    logPhaseBudgetUpdate(user: User, project: Project, phase: Phase, phaseNumber: number, totalPhases: number, oldBudget: number, newBudget: number): Promise<Activity>;
    logPhaseOverdue(user: User, project: Project, phase: Phase, phaseNumber?: number, totalPhases?: number): Promise<Activity>;
    logPhaseDeleted(user: User, project: Project, phase: Phase, phaseNumber: number, totalPhases: number): Promise<Activity>;
    logProjectCreated(user: User, project: Project, task: Task): Promise<Activity>;
    logTaskCompleted(user: User, project: Project, task: Task): Promise<Activity>;
    logCommentAdded(user: User, project: Project, task: Task): Promise<Activity>;
    logCollaboratorAdded(user: User, project: Project, collaborator: User): Promise<Activity>;
    logInventoryAdded(user: User, project: Project, inventoryName: string, metadata?: any): Promise<Activity>;
    logInventoryUpdated(user: User, project: Project, inventoryName: string, metadata?: any): Promise<Activity>;
    logInventoryDeleted(user: User, project: Project, inventoryName: string, metadata?: any): Promise<Activity>;
    getPhaseActivities(phaseId: string, limit?: number, offset?: number): Promise<Activity[]>;
    logJoinRequest(owner: User, project: Project, requester: User): Promise<Activity>;
    getUserProjectActivities(userId: string, limit?: number, offset?: number): Promise<Activity[]>;
    getTrends(period?: string, from?: string, to?: string): Promise<any[]>;
    adminList({ userId, type, dateFrom, dateTo, projectId, search, page, limit, }: {
        userId: any;
        type: any;
        dateFrom: any;
        dateTo: any;
        projectId: any;
        search?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        items: {
            id: string;
            type: ActivityType;
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
    adminGetDetails(id: string): Promise<{
        id: string;
        type: ActivityType;
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
