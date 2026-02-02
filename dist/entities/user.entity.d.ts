import { Project } from "./project.entity";
import { Comment } from "./comment.entity";
import { Department } from "./department.entity";
import { UserPreferences } from "./user-preferences.entity";
import { UserSession } from "./user-session.entity";
export declare enum UserRole {
    USER = "user",
    CONSULTANT = "consultant",
    CONTRACTOR = "contractor",
    SUB_CONTRACTOR = "sub_contractor",
    FINANCE = "finance",
    SUPER_ADMIN = "super_admin"
}
export declare class User {
    id: string;
    email: string;
    password: string;
    display_name: string;
    bio: string;
    avatar_url: string;
    role: UserRole;
    preferences: UserPreferences;
    sessions: UserSession[];
    status: string;
    last_login: Date;
    created_at: Date;
    updated_at: Date;
    owned_projects: Project[];
    collaborating_projects: Project[];
    comments: Comment[];
    department_id: string;
    department: Department;
}
