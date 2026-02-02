import { Project } from "./project.entity";
import { User } from "./user.entity";
export declare enum VisitorPriority {
    HIGH = "high",
    MEDIUM = "medium",
    LOW = "low"
}
export declare class Visitor {
    id: string;
    project_id: string;
    project: Project;
    visitor_name: string;
    company: string | null;
    visit_date: string;
    priority: VisitorPriority;
    purpose: string | null;
    recorded_by: string;
    recordedByUser: User;
    created_at: Date;
    updated_at: Date;
}
