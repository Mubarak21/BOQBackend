import { TaskStatus, TaskPriority } from "../../entities/task.entity";
export declare class CreateTaskDto {
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    due_date?: Date;
    estimated_hours?: number;
    project_id: string;
    assignee_id?: string;
}
