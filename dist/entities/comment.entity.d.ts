import { User } from "./user.entity";
import { Project } from "./project.entity";
import { Task } from "./task.entity";
export declare class Comment {
    id: string;
    content: string;
    author_id: string;
    project_id: string;
    task_id: string;
    created_at: Date;
    updated_at: Date;
    author: User;
    project: Project;
    task: Task;
}
