import { Project } from "./project.entity";
import { Task } from "./task.entity";
export declare class Phase {
    id: string;
    title: string;
    description: string;
    start_date: Date;
    end_date: Date;
    estimated_hours: number;
    budget: number;
    spent: number;
    progress: number;
    status: string;
    assignee_id: string;
    project: Project;
    project_id: string;
    tasks: Task[];
    created_at: Date;
    updated_at: Date;
}
