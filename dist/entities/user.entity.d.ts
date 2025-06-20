import { Project } from "./project.entity";
import { Comment } from "./comment.entity";
export declare enum UserRole {
    USER = "user",
    ADMIN = "admin"
}
export declare class User {
    id: string;
    email: string;
    password: string;
    display_name: string;
    bio: string;
    avatar_url: string;
    role: UserRole;
    notification_preferences: {
        email: boolean;
        project_updates: boolean;
        task_updates: boolean;
    };
    created_at: Date;
    updated_at: Date;
    owned_projects: Project[];
    collaborating_projects: Project[];
    comments: Comment[];
}
