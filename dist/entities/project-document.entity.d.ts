import { Project } from "./project.entity";
import { User } from "./user.entity";
export declare enum DocumentCategory {
    CONTRACT = "contract",
    PERMIT = "permit",
    DRAWING = "drawing",
    REPORT = "report",
    SPECIFICATION = "specification",
    OTHER = "other"
}
export declare class ProjectDocument {
    id: string;
    project_id: string;
    project: Project;
    file_name: string;
    display_name: string | null;
    description: string | null;
    file_path: string;
    mime_type: string | null;
    category: DocumentCategory;
    uploaded_by: string;
    uploadedByUser: User;
    created_at: Date;
    updated_at: Date;
}
