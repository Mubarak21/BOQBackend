import { User } from "./user.entity";
import { Task } from "./task.entity";
import { Comment } from "./comment.entity";
import { Phase } from "./phase.entity";
import { Department } from "./department.entity";
export declare enum ProjectStatus {
    PLANNING = "planning",
    IN_PROGRESS = "in_progress",
    ON_HOLD = "on_hold",
    COMPLETED = "completed",
    CANCELLED = "cancelled"
}
export declare enum ProjectPriority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    URGENT = "urgent"
}
export declare class Project {
    id: string;
    title: string;
    description: string;
    status: ProjectStatus;
    priority: ProjectPriority;
    start_date: Date;
    end_date: Date;
    totalAmount: number;
    totalBudget: number;
    allocatedBudget: number;
    spentAmount: number;
    estimatedSavings: number;
    budgetLastUpdated: Date;
    financialStatus: "on_track" | "warning" | "over_budget" | "excellent";
    owner_id: string;
    owner: User;
    collaborators: User[];
    phases: Phase[];
    tasks: Task[];
    tags: string[];
    created_at: Date;
    updated_at: Date;
    comments: Comment[];
    department_id: string;
    department: Department;
}
