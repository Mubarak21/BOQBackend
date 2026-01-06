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
exports.InventoryController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const inventory_service_1 = require("./inventory.service");
const create_inventory_dto_1 = require("./dto/create-inventory.dto");
const update_inventory_dto_1 = require("./dto/update-inventory.dto");
const inventory_query_dto_1 = require("./dto/inventory-query.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const user_entity_1 = require("../entities/user.entity");
let InventoryController = class InventoryController {
    constructor(inventoryService) {
        this.inventoryService = inventoryService;
    }
    async uploadInventoryDocument(file, req) {
        if (!file) {
            throw new common_1.BadRequestException("No file uploaded");
        }
        const allowedTypes = [
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-excel",
            "text/csv",
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/msword",
            "text/plain",
            "application/json",
            "application/xml",
            "text/xml",
        ];
        const allowedExtensions = [
            ".xlsx",
            ".xls",
            ".csv",
            ".pdf",
            ".docx",
            ".doc",
            ".txt",
            ".json",
            ".xml",
        ];
        const fileExtension = file.originalname
            .toLowerCase()
            .substring(file.originalname.lastIndexOf("."));
        if (!allowedTypes.includes(file.mimetype) &&
            !allowedExtensions.includes(fileExtension)) {
            throw new common_1.BadRequestException("Invalid file type. Please upload Excel (.xlsx, .xls), CSV (.csv), PDF (.pdf), Word (.doc, .docx), Text (.txt), JSON (.json), or XML (.xml) files only.");
        }
        if (file.size > 10 * 1024 * 1024) {
            throw new common_1.BadRequestException("File size too large. Maximum allowed size is 10MB.");
        }
        return this.inventoryService.processInventoryDocument(file, req.user.id);
    }
    async create(files, createInventoryDto, req) {
        const pictureFile = files?.picture?.[0];
        if (!pictureFile) {
            throw new common_1.BadRequestException("Picture evidence is required");
        }
        if (!pictureFile.mimetype.startsWith("image/")) {
            throw new common_1.BadRequestException("Picture file must be an image (JPEG, PNG, etc.)");
        }
        const invoiceFile = files?.invoice?.[0];
        if (invoiceFile) {
            const allowedInvoiceTypes = [
                "application/pdf",
                "image/jpeg",
                "image/png",
                "image/jpg",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "application/msword",
            ];
            if (!allowedInvoiceTypes.includes(invoiceFile.mimetype)) {
                throw new common_1.BadRequestException("Invoice must be a PDF, image (JPEG/PNG), or Word document");
            }
        }
        return this.inventoryService.create(createInventoryDto, req.user.id, pictureFile, invoiceFile);
    }
    async findAll(query) {
        return this.inventoryService.findAll(query);
    }
    async getStats() {
        return this.inventoryService.getStats();
    }
    async getLowStockItems(query) {
        return this.inventoryService.findAll({ ...query, low_stock: true });
    }
    async searchInventory(searchQuery, query) {
        return this.inventoryService.findAll({ ...query, search: searchQuery });
    }
    async findOne(id) {
        return this.inventoryService.findOne(id);
    }
    async update(id, updateInventoryDto, req) {
        return this.inventoryService.update(id, updateInventoryDto, req.user.id);
    }
    async remove(id, req) {
        await this.inventoryService.remove(id, req.user.id);
        return { message: "Inventory item deleted successfully" };
    }
    async bulkUpdateQuantities(updates, req) {
        const results = [];
        for (const update of updates) {
            try {
                const item = await this.inventoryService.update(update.id, { quantity_available: update.quantity_available }, req.user.id);
                results.push({ id: update.id, success: true, item });
            }
            catch (error) {
                results.push({ id: update.id, success: false, error: error.message });
            }
        }
        return { results };
    }
    async exportToCsv(query) {
        const { items } = await this.inventoryService.findAll({
            ...query,
            limit: 10000,
        });
        const csvHeader = "Name,Description,Unit,Unit Price,Category,Brand,Model,Supplier,Quantity Available,Minimum Stock,Active,Created At\n";
        const csvRows = items
            .map((item) => [
            item.name,
            item.description || "",
            item.unit,
            item.unit_price,
            item.category,
            item.brand || "",
            item.model || "",
            item.supplier || "",
            item.quantity_available,
            item.minimum_stock,
            item.is_active,
            item.created_at.toISOString(),
        ]
            .map((field) => `"${field}"`)
            .join(","))
            .join("\n");
        return {
            filename: `inventory_export_${new Date().toISOString().split("T")[0]}.csv`,
            content: csvHeader + csvRows,
            contentType: "text/csv",
        };
    }
};
exports.InventoryController = InventoryController;
__decorate([
    (0, common_1.Post)("upload"),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)("file")),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "uploadInventoryDocument", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileFieldsInterceptor)([
        { name: "picture", maxCount: 1 },
        { name: "invoice", maxCount: 1 },
    ], {
        limits: { fileSize: 10 * 1024 * 1024 },
    })),
    __param(0, (0, common_1.UploadedFiles)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_inventory_dto_1.CreateInventoryDto, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_query_dto_1.InventoryQueryDto]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)("stats"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)("low-stock"),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_query_dto_1.InventoryQueryDto]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getLowStockItems", null);
__decorate([
    (0, common_1.Get)("search"),
    __param(0, (0, common_1.Query)("q")),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, inventory_query_dto_1.InventoryQueryDto]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "searchInventory", null);
__decorate([
    (0, common_1.Get)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_inventory_dto_1.UpdateInventoryDto, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "remove", null);
__decorate([
    (0, common_1.Patch)("bulk/quantities"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "bulkUpdateQuantities", null);
__decorate([
    (0, common_1.Get)("export/csv"),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_query_dto_1.InventoryQueryDto]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "exportToCsv", null);
exports.InventoryController = InventoryController = __decorate([
    (0, common_1.Controller)("inventory"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.FINANCE, user_entity_1.UserRole.USER),
    __metadata("design:paramtypes", [inventory_service_1.InventoryService])
], InventoryController);
//# sourceMappingURL=inventory.controller.js.map