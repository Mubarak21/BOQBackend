import { Project } from "./project.entity";
export declare enum EquipmentCategory {
    MACHINERY = "machinery",
    VEHICLES = "vehicles",
    TOOLS = "tools",
    OTHER = "other"
}
export declare enum EquipmentStatus {
    IN_USE = "in_use",
    AVAILABLE = "available",
    MAINTENANCE = "maintenance"
}
export declare class Equipment {
    id: string;
    project_id: string;
    project: Project;
    name: string;
    description: string | null;
    quantity: number;
    category: EquipmentCategory;
    status: EquipmentStatus;
    serial_number: string | null;
    created_at: Date;
    updated_at: Date;
}
