import { Project } from "./project.entity";
import { Task } from "./task.entity";
import { User } from "./user.entity";
import { SubPhase } from "./sub-phase.entity";
export declare enum PhaseStatus {
    NOT_STARTED = "not_started",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    DELAYED = "delayed"
}
export declare class Phase {
    id: string;
    title: string;
    description: string;
    start_date: Date;
    end_date: Date;
    estimated_hours: number;
    budget: number;
    progress: number;
    status: PhaseStatus;
    assignee_id: string;
    assignee: User;
    project: Project;
    project_id: string;
    tasks: Task[];
    created_at: Date;
    updated_at: Date;
    work_description: string;
    deliverables: string;
    requirements: string;
    risks: string;
    dependencies: string;
    priority: string;
    due_date: Date;
    reference_task_id: string;
    subPhases: SubPhase[];
}
