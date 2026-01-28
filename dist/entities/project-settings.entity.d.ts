import { Project } from "./project.entity";
export declare class ProjectSettings {
    id: string;
    project_id: string;
    project: Project;
    allow_collaborator_invites: boolean;
    allow_task_creation: boolean;
    allow_phase_modification: boolean;
    require_approval_for_transactions: boolean;
    approval_threshold: number;
    send_notifications: boolean;
    track_inventory: boolean;
    track_time: boolean;
    currency: string;
    language: string;
    custom_settings: Record<string, any>;
    notification_rules: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
