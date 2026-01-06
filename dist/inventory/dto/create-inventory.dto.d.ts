import { InventoryCategory } from "../../entities/inventory.entity";
export declare class CreateInventoryDto {
    project_id?: string;
    name: string;
    description?: string;
    unit: string;
    unit_price: number;
    category?: InventoryCategory;
    brand?: string;
    model?: string;
    supplier?: string;
    supplier_contact?: string;
    quantity_available?: number;
    minimum_stock?: number;
    sku?: string;
    barcode?: string;
    tags?: string[];
    is_active?: boolean;
    notes?: string;
}
