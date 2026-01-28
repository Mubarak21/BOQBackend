import { Project } from "./project.entity";
import { User } from "./user.entity";
export declare enum BOQType {
    CONTRACTOR = "contractor",
    SUB_CONTRACTOR = "sub_contractor"
}
export declare enum BOQStatus {
    PENDING = "pending",
    PROCESSING = "processing",
    PROCESSED = "processed",
    FAILED = "failed"
}
export declare class ProjectBoq {
    id: string;
    project_id: string;
    project: Project;
    type: BOQType;
    status: BOQStatus;
    file_name: string;
    file_path: string;
    file_mimetype: string;
    file_size: number;
    total_amount: number;
    phases_count: number;
    uploaded_by: string;
    uploader: User;
    error_message: string;
    created_at: Date;
    updated_at: Date;
}
