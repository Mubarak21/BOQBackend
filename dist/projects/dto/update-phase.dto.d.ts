import { TaskStatus, TaskPriority } from "../../entities/task.entity";
export declare class UpdatePhaseDto {
    title?: string;
    description?: string;
    work_description?: string;
    deliverables?: string;
    requirements?: string;
    risks?: string;
    dependencies?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    start_date?: string;
    end_date?: string;
    due_date?: string;
    budget?: number;
    spent?: number;
    progress?: number;
    estimated_hours?: number;
    assignee_id?: string;
    parent_phase_id?: string;
}
