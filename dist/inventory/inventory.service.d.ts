import { Repository } from "typeorm";
import { Inventory } from "../entities/inventory.entity";
import { User } from "../entities/user.entity";
import { CreateInventoryDto } from "./dto/create-inventory.dto";
import { UpdateInventoryDto } from "./dto/update-inventory.dto";
import { InventoryQueryDto } from "./dto/inventory-query.dto";
export interface DocumentParseResult {
    totalProcessed: number;
    successful: number;
    failed: number;
    items: Inventory[];
    errors: string[];
}
export declare class InventoryService {
    private readonly inventoryRepository;
    private readonly userRepository;
    constructor(inventoryRepository: Repository<Inventory>, userRepository: Repository<User>);
    create(createInventoryDto: CreateInventoryDto, userId: string, pictureFile?: Express.Multer.File, invoiceFile?: Express.Multer.File): Promise<Inventory>;
    findAll(query: InventoryQueryDto): Promise<{
        items: Inventory[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string): Promise<Inventory>;
    update(id: string, updateInventoryDto: UpdateInventoryDto, userId: string): Promise<Inventory>;
    remove(id: string, userId: string): Promise<void>;
    processInventoryDocument(file: Express.Multer.File, userId: string): Promise<DocumentParseResult>;
    private parseExcelFile;
    private parseCsvFile;
    private parsePdfFile;
    private parseWordFile;
    private parseTextFile;
    private parseJsonFile;
    private parseXmlFile;
    private createFromParsedRow;
    getStats(): Promise<{
        totalItems: number;
        activeItems: number;
        lowStockItems: number;
        totalValue: number;
        categoryCounts: {
            [key: string]: number;
        };
    }>;
}
