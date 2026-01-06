import { InventoryService } from "./inventory.service";
import { CreateInventoryDto } from "./dto/create-inventory.dto";
import { UpdateInventoryDto } from "./dto/update-inventory.dto";
import { InventoryQueryDto } from "./dto/inventory-query.dto";
import { RequestWithUser } from "../auth/interfaces/request-with-user.interface";
export declare class InventoryController {
    private readonly inventoryService;
    constructor(inventoryService: InventoryService);
    uploadInventoryDocument(file: Express.Multer.File, req: RequestWithUser): Promise<import("./inventory.service").DocumentParseResult>;
    create(files: {
        picture?: Express.Multer.File[];
        invoice?: Express.Multer.File[];
    }, createInventoryDto: CreateInventoryDto, req: RequestWithUser): Promise<import("../entities/inventory.entity").Inventory>;
    findAll(query: InventoryQueryDto): Promise<{
        items: import("../entities/inventory.entity").Inventory[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getStats(): Promise<{
        totalItems: number;
        activeItems: number;
        lowStockItems: number;
        totalValue: number;
        categoryCounts: {
            [key: string]: number;
        };
    }>;
    getLowStockItems(query: InventoryQueryDto): Promise<{
        items: import("../entities/inventory.entity").Inventory[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    searchInventory(searchQuery: string, query: InventoryQueryDto): Promise<{
        items: import("../entities/inventory.entity").Inventory[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string): Promise<import("../entities/inventory.entity").Inventory>;
    update(id: string, updateInventoryDto: UpdateInventoryDto, req: RequestWithUser): Promise<import("../entities/inventory.entity").Inventory>;
    remove(id: string, req: RequestWithUser): Promise<{
        message: string;
    }>;
    bulkUpdateQuantities(updates: Array<{
        id: string;
        quantity_available: number;
    }>, req: RequestWithUser): Promise<{
        results: any[];
    }>;
    exportToCsv(query: InventoryQueryDto): Promise<{
        filename: string;
        content: string;
        contentType: string;
    }>;
}
