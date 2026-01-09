"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const inventory_entity_1 = require("../entities/inventory.entity");
const user_entity_1 = require("../entities/user.entity");
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const xml2js = require("xml2js");
const textract = require("textract");
let InventoryService = class InventoryService {
    constructor(inventoryRepository, userRepository) {
        this.inventoryRepository = inventoryRepository;
        this.userRepository = userRepository;
    }
    async create(createInventoryDto, userId, pictureFile, invoiceFile) {
        let pictureUrl = null;
        let invoiceUrl = null;
        if (pictureFile) {
            const uploadDir = path.join(process.cwd(), "uploads", "inventory", "pictures");
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            const fileName = `${Date.now()}-${pictureFile.originalname.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
            const filePath = path.join(uploadDir, fileName);
            fs.writeFileSync(filePath, pictureFile.buffer);
            pictureUrl = `/uploads/inventory/pictures/${fileName}`;
        }
        if (invoiceFile) {
            const uploadDir = path.join(process.cwd(), "uploads", "inventory", "invoices");
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            const fileName = `${Date.now()}-${invoiceFile.originalname.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
            const filePath = path.join(uploadDir, fileName);
            fs.writeFileSync(filePath, invoiceFile.buffer);
            invoiceUrl = `/uploads/inventory/invoices/${fileName}`;
        }
        const inventory = this.inventoryRepository.create({
            ...createInventoryDto,
            picture_url: pictureUrl,
            invoice_url: invoiceUrl,
            created_by: userId,
        });
        return this.inventoryRepository.save(inventory);
    }
    async findAll(query) {
        const { page = 1, limit = 10, search, category, supplier, is_active, low_stock, sortBy = "name", sortOrder = "ASC", } = query;
        const queryBuilder = this.inventoryRepository
            .createQueryBuilder("inventory")
            .leftJoinAndSelect("inventory.creator", "creator");
        if (search) {
            queryBuilder.andWhere("(inventory.name ILIKE :search OR inventory.description ILIKE :search OR inventory.brand ILIKE :search OR inventory.model ILIKE :search)", { search: `%${search}%` });
        }
        if (category) {
            queryBuilder.andWhere("inventory.category = :category", { category });
        }
        if (supplier) {
            queryBuilder.andWhere("inventory.supplier ILIKE :supplier", {
                supplier: `%${supplier}%`,
            });
        }
        if (is_active !== undefined) {
            queryBuilder.andWhere("inventory.is_active = :is_active", { is_active });
        }
        if (low_stock) {
            queryBuilder.andWhere("inventory.quantity_available <= inventory.minimum_stock");
        }
        const allowedSortFields = [
            'name',
            'category',
            'quantity_available',
            'unit_price',
            'created_at',
            'updated_at',
            'supplier',
            'is_active',
        ];
        const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'name';
        queryBuilder.orderBy(`inventory.${validSortBy}`, sortOrder);
        const skip = (page - 1) * limit;
        queryBuilder.skip(skip).take(limit);
        const [items, total] = await queryBuilder.getManyAndCount();
        return {
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async findOne(id) {
        const inventory = await this.inventoryRepository.findOne({
            where: { id },
            relations: ["creator"],
        });
        if (!inventory) {
            throw new common_1.NotFoundException(`Inventory item with ID ${id} not found`);
        }
        return inventory;
    }
    async update(id, updateInventoryDto, userId) {
        const inventory = await this.findOne(id);
        const user = await this.userRepository.findOne({
            where: { id: userId },
            select: ["id", "role"],
        });
        const isCreator = inventory.created_by === userId;
        const isAdmin = user?.role === user_entity_1.UserRole.CONSULTANT;
        const isFinanceManager = user?.role === user_entity_1.UserRole.FINANCE;
        if (!isCreator && !isAdmin && !isFinanceManager) {
            throw new common_1.ForbiddenException("You don't have permission to update this inventory item");
        }
        Object.assign(inventory, updateInventoryDto);
        return this.inventoryRepository.save(inventory);
    }
    async remove(id, userId) {
        const inventory = await this.findOne(id);
        const user = await this.userRepository.findOne({
            where: { id: userId },
            select: ["id", "role"],
        });
        const isCreator = inventory.created_by === userId;
        const isAdmin = user?.role === user_entity_1.UserRole.CONSULTANT;
        const isFinanceManager = user?.role === user_entity_1.UserRole.FINANCE;
        if (!isCreator && !isAdmin && !isFinanceManager) {
            throw new common_1.ForbiddenException("You don't have permission to delete this inventory item");
        }
        await this.inventoryRepository.remove(inventory);
    }
    async processInventoryDocument(file, userId) {
        if (!file) {
            throw new common_1.BadRequestException("No file uploaded");
        }
        const result = {
            totalProcessed: 0,
            successful: 0,
            failed: 0,
            items: [],
            errors: [],
        };
        try {
            let parsedData = [];
            const fileExtension = file.originalname
                .toLowerCase()
                .substring(file.originalname.lastIndexOf("."));
            if (file.mimetype.includes("spreadsheet") ||
                file.mimetype.includes("excel") ||
                fileExtension === ".xlsx" ||
                fileExtension === ".xls") {
                parsedData = await this.parseExcelFile(file);
            }
            else if (file.mimetype.includes("csv") || fileExtension === ".csv") {
                parsedData = await this.parseCsvFile(file);
            }
            else if (file.mimetype === "application/pdf" ||
                fileExtension === ".pdf") {
                parsedData = await this.parsePdfFile(file);
            }
            else if (file.mimetype ===
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
                file.mimetype === "application/msword" ||
                fileExtension === ".docx" ||
                fileExtension === ".doc") {
                parsedData = await this.parseWordFile(file);
            }
            else if (file.mimetype === "text/plain" || fileExtension === ".txt") {
                parsedData = await this.parseTextFile(file);
            }
            else if (file.mimetype === "application/json" ||
                fileExtension === ".json") {
                parsedData = await this.parseJsonFile(file);
            }
            else if (file.mimetype === "application/xml" ||
                file.mimetype === "text/xml" ||
                fileExtension === ".xml") {
                parsedData = await this.parseXmlFile(file);
            }
            else {
                throw new common_1.BadRequestException("Unsupported file format. Please upload Excel (.xlsx, .xls), CSV (.csv), PDF (.pdf), Word (.doc, .docx), Text (.txt), JSON (.json), or XML (.xml) files.");
            }
            result.totalProcessed = parsedData.length;
            for (const row of parsedData) {
                try {
                    const inventoryItem = await this.createFromParsedRow(row, userId, file.originalname);
                    result.items.push(inventoryItem);
                    result.successful++;
                }
                catch (error) {
                    result.failed++;
                    result.errors.push(`Row ${result.successful + result.failed}: ${error.message}`);
                }
            }
            return result;
        }
        catch (error) {
            throw new common_1.BadRequestException(`Failed to process document: ${error.message}`);
        }
    }
    async parseExcelFile(file) {
        const workbook = XLSX.read(file.buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        return XLSX.utils.sheet_to_json(worksheet, { header: 1 }).slice(1);
    }
    async parseCsvFile(file) {
        const csvContent = file.buffer.toString();
        const lines = csvContent.split("\n").filter((line) => line.trim());
        const headers = lines[0].split(",").map((h) => h.trim());
        return lines.slice(1).map((line) => {
            const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
            const obj = {};
            headers.forEach((header, index) => {
                obj[header] = values[index] || "";
            });
            return Object.values(obj);
        });
    }
    async parsePdfFile(file) {
        try {
            const data = await pdfParse(file.buffer);
            const text = data.text;
            const lines = text.split("\n").filter((line) => line.trim());
            const dataLines = lines.filter((line) => {
                const fields = line.trim().split(/\s{2,}|\t/);
                return fields.length >= 3;
            });
            return dataLines.map((line) => {
                const fields = line
                    .trim()
                    .split(/\s{2,}|\t/)
                    .map((f) => f.trim());
                return fields;
            });
        }
        catch (error) {
            throw new common_1.BadRequestException(`Failed to parse PDF file: ${error.message}`);
        }
    }
    async parseWordFile(file) {
        try {
            let text = "";
            if (file.originalname.endsWith(".docx")) {
                const result = await mammoth.extractRawText({ buffer: file.buffer });
                text = result.value;
            }
            else {
                text = await new Promise((resolve, reject) => {
                    textract.fromBufferWithMime("application/msword", file.buffer, (error, extractedText) => {
                        if (error)
                            reject(error);
                        else
                            resolve(extractedText || "");
                    });
                });
            }
            const lines = text.split("\n").filter((line) => line.trim());
            const dataLines = lines.filter((line) => {
                const fields = line.trim().split(/\s{2,}|\t/);
                return fields.length >= 3;
            });
            return dataLines.map((line) => {
                const fields = line
                    .trim()
                    .split(/\s{2,}|\t/)
                    .map((f) => f.trim());
                return fields;
            });
        }
        catch (error) {
            throw new common_1.BadRequestException(`Failed to parse Word document: ${error.message}`);
        }
    }
    async parseTextFile(file) {
        try {
            const content = file.buffer.toString("utf-8");
            const lines = content.split("\n").filter((line) => line.trim());
            const delimiters = [",", "\t", "|", ";"];
            let bestDelimiter = ",";
            let maxFields = 0;
            for (const delimiter of delimiters) {
                const testLine = lines[1] || lines[0];
                const fields = testLine.split(delimiter);
                if (fields.length > maxFields) {
                    maxFields = fields.length;
                    bestDelimiter = delimiter;
                }
            }
            const dataLines = lines.slice(1).length > 0 ? lines.slice(1) : lines;
            return dataLines.map((line) => {
                return line
                    .split(bestDelimiter)
                    .map((field) => field.trim().replace(/"/g, ""));
            });
        }
        catch (error) {
            throw new common_1.BadRequestException(`Failed to parse text file: ${error.message}`);
        }
    }
    async parseJsonFile(file) {
        try {
            const content = file.buffer.toString("utf-8");
            const jsonData = JSON.parse(content);
            let items = [];
            if (Array.isArray(jsonData)) {
                items = jsonData;
            }
            else if (jsonData.items && Array.isArray(jsonData.items)) {
                items = jsonData.items;
            }
            else if (jsonData.inventory && Array.isArray(jsonData.inventory)) {
                items = jsonData.inventory;
            }
            else if (jsonData.data && Array.isArray(jsonData.data)) {
                items = jsonData.data;
            }
            else {
                throw new common_1.BadRequestException("JSON structure not supported. Expected an array of items or an object with items/inventory/data array.");
            }
            return items.map((item) => {
                if (typeof item === "object") {
                    return [
                        item.name || item.Name || "",
                        item.description || item.Description || "",
                        item.unit || item.Unit || "",
                        item.unit_price || item.unitPrice || item.price || item.Price || "",
                        item.category || item.Category || "",
                        item.brand || item.Brand || "",
                        item.model || item.Model || "",
                        item.supplier || item.Supplier || "",
                        item.quantity_available ||
                            item.quantityAvailable ||
                            item.quantity ||
                            item.Quantity ||
                            "",
                        item.minimum_stock ||
                            item.minimumStock ||
                            item.minStock ||
                            item.MinStock ||
                            "",
                    ];
                }
                return item;
            });
        }
        catch (error) {
            throw new common_1.BadRequestException(`Failed to parse JSON file: ${error.message}`);
        }
    }
    async parseXmlFile(file) {
        try {
            const content = file.buffer.toString("utf-8");
            const parser = new xml2js.Parser({ explicitArray: false });
            const result = await parser.parseStringPromise(content);
            let items = [];
            if (result.inventory && result.inventory.item) {
                items = Array.isArray(result.inventory.item)
                    ? result.inventory.item
                    : [result.inventory.item];
            }
            else if (result.items && result.items.item) {
                items = Array.isArray(result.items.item)
                    ? result.items.item
                    : [result.items.item];
            }
            else if (result.data && result.data.item) {
                items = Array.isArray(result.data.item)
                    ? result.data.item
                    : [result.data.item];
            }
            else if (result.root && result.root.item) {
                items = Array.isArray(result.root.item)
                    ? result.root.item
                    : [result.root.item];
            }
            else {
                const findItems = (obj) => {
                    if (Array.isArray(obj))
                        return obj;
                    if (typeof obj === "object") {
                        for (const key in obj) {
                            if (Array.isArray(obj[key]))
                                return obj[key];
                            const nested = findItems(obj[key]);
                            if (nested.length > 0)
                                return nested;
                        }
                    }
                    return [];
                };
                items = findItems(result);
            }
            if (items.length === 0) {
                throw new common_1.BadRequestException("No items found in XML structure. Expected <inventory>, <items>, <data>, or <root> with <item> elements.");
            }
            return items.map((item) => [
                item.name || item.Name || "",
                item.description || item.Description || "",
                item.unit || item.Unit || "",
                item.unit_price || item.unitPrice || item.price || item.Price || "",
                item.category || item.Category || "",
                item.brand || item.Brand || "",
                item.model || item.Model || "",
                item.supplier || item.Supplier || "",
                item.quantity_available ||
                    item.quantityAvailable ||
                    item.quantity ||
                    item.Quantity ||
                    "",
                item.minimum_stock ||
                    item.minimumStock ||
                    item.minStock ||
                    item.MinStock ||
                    "",
            ]);
        }
        catch (error) {
            throw new common_1.BadRequestException(`Failed to parse XML file: ${error.message}`);
        }
    }
    async createFromParsedRow(row, userId, sourceDocument) {
        const [name, description, unit, unitPrice, category, brand, model, supplier, quantityAvailable, minimumStock, ...rest] = row;
        if (!name || !unit || !unitPrice) {
            throw new Error("Missing required fields: name, unit, or unit_price");
        }
        const price = parseFloat(unitPrice?.toString().replace(/[^\d.-]/g, ""));
        if (isNaN(price) || price < 0) {
            throw new Error("Invalid unit price");
        }
        let inventoryCategory = inventory_entity_1.InventoryCategory.MATERIALS;
        if (category) {
            const categoryStr = category.toString().toLowerCase();
            const categoryMapping = {
                material: inventory_entity_1.InventoryCategory.MATERIALS,
                materials: inventory_entity_1.InventoryCategory.MATERIALS,
                equipment: inventory_entity_1.InventoryCategory.EQUIPMENT,
                tool: inventory_entity_1.InventoryCategory.TOOLS,
                tools: inventory_entity_1.InventoryCategory.TOOLS,
                service: inventory_entity_1.InventoryCategory.SERVICES,
                services: inventory_entity_1.InventoryCategory.SERVICES,
                labor: inventory_entity_1.InventoryCategory.LABOR,
                labour: inventory_entity_1.InventoryCategory.LABOR,
            };
            inventoryCategory =
                categoryMapping[categoryStr] || inventory_entity_1.InventoryCategory.OTHER;
        }
        const createDto = {
            name: name.toString().trim(),
            description: description?.toString().trim() || null,
            unit: unit.toString().trim(),
            unit_price: price,
            category: inventoryCategory,
            brand: brand?.toString().trim() || null,
            model: model?.toString().trim() || null,
            supplier: supplier?.toString().trim() || null,
            quantity_available: quantityAvailable
                ? parseInt(quantityAvailable.toString()) || 0
                : 0,
            minimum_stock: minimumStock ? parseInt(minimumStock.toString()) || 0 : 0,
            is_active: true,
        };
        const inventory = this.inventoryRepository.create({
            ...createDto,
            created_by: userId,
            source_document: sourceDocument,
        });
        return this.inventoryRepository.save(inventory);
    }
    async getStats() {
        const [totalItems, activeItems, lowStockItems, allItems] = await Promise.all([
            this.inventoryRepository.count(),
            this.inventoryRepository.count({ where: { is_active: true } }),
            this.inventoryRepository
                .createQueryBuilder("inventory")
                .where("inventory.quantity_available <= inventory.minimum_stock")
                .andWhere("inventory.is_active = true")
                .getCount(),
            this.inventoryRepository.find({ where: { is_active: true } }),
        ]);
        const totalValue = allItems.reduce((sum, item) => sum + item.unit_price * item.quantity_available, 0);
        const categoryCounts = {};
        Object.values(inventory_entity_1.InventoryCategory).forEach((category) => {
            categoryCounts[category] = 0;
        });
        allItems.forEach((item) => {
            categoryCounts[item.category]++;
        });
        return {
            totalItems,
            activeItems,
            lowStockItems,
            totalValue,
            categoryCounts,
        };
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(inventory_entity_1.Inventory)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map