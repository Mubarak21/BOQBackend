import { User } from "./user.entity";
import { Project } from "./project.entity";
import { Inventory } from "./inventory.entity";
import { Phase } from "./phase.entity";
export declare class InventoryUsage {
    id: string;
    inventory_id: string;
    inventory: Inventory;
    project_id: string;
    project: Project;
    quantity_used: number;
    phase_id: string;
    phase: Phase;
    notes: string;
    used_by: string;
    user: User;
    used_at: Date;
    created_at: Date;
    updated_at: Date;
}
