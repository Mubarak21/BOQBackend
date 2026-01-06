import { User } from "./user.entity";
import { Project } from "./project.entity";
import { Task } from "./task.entity";
export declare enum ActivityType {
    PROJECT_CREATED = "project_created",
    PROJECT_UPDATED = "project_updated",
    PROJECT_DELETED = "project_deleted",
    TASK_CREATED = "task_created",
    TASK_UPDATED = "task_updated",
    TASK_DELETED = "task_deleted",
    TASK_COMPLETED = "task_completed",
    TASK_REOPENED = "task_reopened",
    PHASE_COMPLETED = "phase_completed",
    PHASE_REOPENED = "phase_reopened",
    SCHEDULE_DELAY = "schedule_delay",
    BOQ_UPLOADED = "boq_uploaded",
    COMMENT_ADDED = "comment_added",
    COLLABORATOR_ADDED = "collaborator_added",
    COLLABORATOR_REMOVED = "collaborator_removed",
    INVENTORY_ADDED = "inventory_added",
    INVENTORY_UPDATED = "inventory_updated",
    INVENTORY_DELETED = "inventory_deleted"
}
export declare class Activity {
    id: string;
    type: ActivityType;
    description: string;
    metadata: string;
    user_id: string;
    user: User;
    project_id: string;
    project: Project;
    task_id: string;
    task: Task;
    created_at: Date;
}
