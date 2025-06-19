import { Repository } from "typeorm";
import { Activity, ActivityType } from "../entities/activity.entity";
import { User } from "../entities/user.entity";
import { Project } from "../entities/project.entity";
import { Task } from "../entities/task.entity";
export declare class ActivitiesService {
    private activitiesRepository;
    constructor(activitiesRepository: Repository<Activity>);
    createActivity(type: ActivityType, description: string, user: User, project: Project, task?: Task, metadata?: any): Promise<Activity>;
    getProjectActivities(projectId: string, limit?: number, offset?: number): Promise<Activity[]>;
    getUserActivities(userId: string, limit?: number, offset?: number): Promise<Activity[]>;
    getRecentActivities(limit?: number, offset?: number): Promise<Activity[]>;
    logBoqUploaded(user: User, project: Project, filename: string, totalPhases: number, totalAmount: number): Promise<Activity>;
    logPhaseCreated(user: User, project: Project, phase: Task, phaseNumber: number, totalPhases: number): Promise<Activity>;
    logPhaseCompleted(user: User, project: Project, phase: Task, phaseNumber: number, totalPhases: number): Promise<Activity>;
    logPhaseProgress(user: User, project: Project, phase: Task, phaseNumber: number, totalPhases: number, progress: number): Promise<Activity>;
    logPhaseDelay(user: User, project: Project, phase: Task, phaseNumber: number, totalPhases: number, delayDays: number): Promise<Activity>;
    logPhaseBudgetUpdate(user: User, project: Project, phase: Task, phaseNumber: number, totalPhases: number, oldBudget: number, newBudget: number): Promise<Activity>;
    logPhaseDeleted(user: User, project: Project, phase: Task, phaseNumber: number, totalPhases: number): Promise<Activity>;
    logProjectCreated(user: User, project: Project): Promise<Activity>;
    logTaskCompleted(user: User, project: Project, task: Task): Promise<Activity>;
    logCommentAdded(user: User, project: Project, task: Task, commentContent: string): Promise<Activity>;
    logCollaboratorAdded(user: User, project: Project, collaborator: User): Promise<Activity>;
}
