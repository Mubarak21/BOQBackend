import { User } from "./user.entity";
import { Project } from "./project.entity";
export declare enum InventoryCategory {
    MATERIALS = "materials",
    EQUIPMENT = "equipment",
    TOOLS = "tools",
    SERVICES = "services",
    LABOR = "labor",
    OTHER = "other"
}
export declare class Inventory {
    id: string;
    name: string;
    description: string;
    unit: string;
    unit_price: number;
    category: InventoryCategory;
    brand: string;
    model: string;
    supplier: string;
    supplier_contact: string;
    quantity_available: number;
    quantity_used: number;
    minimum_stock: number;
    sku: string;
    barcode: string;
    tags: string[];
    is_active: boolean;
    notes: string;
    project_id: string;
    project: Project;
    created_by: string;
    creator: User;
    source_document: string;
    picture_url: string;
    invoice_url: string;
    created_at: Date;
    updated_at: Date;
}
