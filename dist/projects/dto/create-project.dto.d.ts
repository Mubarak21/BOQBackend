import { ProjectStatus, ProjectPriority } from "../../entities/project.entity";
export declare class CreateProjectDto {
    title: string;
    description?: string;
    status?: ProjectStatus;
    priority?: ProjectPriority;
    start_date?: string;
    end_date?: string;
    tags?: string[];
    collaborator_ids?: string[];
    totalAmount?: number;
}
