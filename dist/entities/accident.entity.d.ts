import { User } from "./user.entity";
import { Project } from "./project.entity";
export declare enum AccidentSeverity {
    MINOR = "minor",
    MODERATE = "moderate",
    SERIOUS = "serious",
    FATAL = "fatal"
}
export declare enum AccidentStatus {
    REPORTED = "reported",
    UNDER_REVIEW = "under_review",
    CLOSED = "closed"
}
export declare class Accident {
    id: string;
    project_id: string;
    project: Project;
    reported_by: string;
    reportedByUser: User;
    accident_date: string;
    description: string;
    severity: AccidentSeverity;
    location: string | null;
    injured_count: number;
    action_taken: string | null;
    status: AccidentStatus;
    created_at: Date;
    updated_at: Date;
}
