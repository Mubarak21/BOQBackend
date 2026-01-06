import { InventoryCategory } from "../../entities/inventory.entity";
export declare class InventoryQueryDto {
    search?: string;
    category?: InventoryCategory;
    supplier?: string;
    is_active?: boolean;
    low_stock?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
}
