import { Project } from "./project.entity";
export declare class ProjectMetadata {
    id: string;
    project_id: string;
    project: Project;
    location: string;
    address: string;
    coordinates: string;
    client_name: string;
    client_contact: string;
    client_email: string;
    architect: string;
    engineer: string;
    contractor_name: string;
    contract_number: string;
    contract_date: Date;
    permit_number: string;
    permit_issued_date: Date;
    notes: string;
    custom_fields: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
