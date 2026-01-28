import { User } from "./user.entity";
import { Task } from "./task.entity";
import { Comment } from "./comment.entity";
import { Phase } from "./phase.entity";
import { ContractorPhase } from "./contractor-phase.entity";
import { SubContractorPhase } from "./sub-contractor-phase.entity";
import { Department } from "./department.entity";
import { ProjectFinancialSummary } from "./project-financial-summary.entity";
import { ProjectMetadata } from "./project-metadata.entity";
import { ProjectSettings } from "./project-settings.entity";
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
    financialSummary: ProjectFinancialSummary;
    metadata: ProjectMetadata;
    settings: ProjectSettings;
    owner_id: string;
    owner: User;
    collaborators: User[];
    phases: Phase[];
    contractorPhases: ContractorPhase[];
    subContractorPhases: SubContractorPhase[];
    tasks: Task[];
    tags: string[];
    created_at: Date;
    updated_at: Date;
    comments: Comment[];
    department_id: string;
    department: Department;
}
