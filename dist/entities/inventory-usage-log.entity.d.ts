import { Inventory } from "./inventory.entity";
import { Project } from "./project.entity";
import { Phase } from "./phase.entity";
import { User } from "./user.entity";
export declare enum UsageType {
    USED = "used",
    RETURNED = "returned",
    DAMAGED = "damaged",
    LOST = "lost",
    ADJUSTMENT = "adjustment"
}
export declare class InventoryUsageLog {
    id: string;
    inventoryId: string;
    inventory: Inventory;
    projectId: string;
    project: Project;
    phaseId: string;
    phase: Phase;
    usage_type: UsageType;
    quantity: number;
    unit_price: number;
    total_cost: number;
    notes: string;
    recordedBy: string;
    recorder: User;
    usage_date: Date;
    createdAt: Date;
}
