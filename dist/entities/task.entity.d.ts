import { Project } from "./project.entity";
import { Phase } from "./phase.entity";
export declare class Task {
    id: string;
    description: string;
    unit: string;
    quantity: number;
    price: number;
    project_id: string;
    project: Project;
    phase_id: string;
    phase: Phase;
    created_at: Date;
    updated_at: Date;
    parentTask: Task;
    subTasks: Task[];
    parent_task_id: string;
}
