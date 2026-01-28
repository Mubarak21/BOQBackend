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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Inventory = exports.InventoryCategory = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const project_entity_1 = require("./project.entity");
const supplier_entity_1 = require("./supplier.entity");
const inventory_usage_log_entity_1 = require("./inventory-usage-log.entity");
var InventoryCategory;
(function (InventoryCategory) {
    InventoryCategory["MATERIALS"] = "materials";
    InventoryCategory["EQUIPMENT"] = "equipment";
    InventoryCategory["TOOLS"] = "tools";
    InventoryCategory["SERVICES"] = "services";
    InventoryCategory["LABOR"] = "labor";
    InventoryCategory["OTHER"] = "other";
})(InventoryCategory || (exports.InventoryCategory = InventoryCategory = {}));
let Inventory = class Inventory {
};
exports.Inventory = Inventory;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Inventory.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Inventory.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Inventory.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Inventory.prototype, "unit", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "decimal",
        precision: 15,
        scale: 2,
    }),
    __metadata("design:type", Number)
], Inventory.prototype, "unit_price", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: InventoryCategory,
        default: InventoryCategory.MATERIALS,
    }),
    __metadata("design:type", String)
], Inventory.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Inventory.prototype, "brand", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Inventory.prototype, "model", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "supplier_id", nullable: true }),
    __metadata("design:type", String)
], Inventory.prototype, "supplierId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => supplier_entity_1.Supplier, (supplier) => supplier.inventory_items, {
        nullable: true,
    }),
    (0, typeorm_1.JoinColumn)({ name: "supplier_id" }),
    __metadata("design:type", supplier_entity_1.Supplier)
], Inventory.prototype, "supplier", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => inventory_usage_log_entity_1.InventoryUsageLog, (log) => log.inventory),
    __metadata("design:type", Array)
], Inventory.prototype, "usageLogs", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", default: 0 }),
    __metadata("design:type", Number)
], Inventory.prototype, "quantity_available", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", default: 0 }),
    __metadata("design:type", Number)
], Inventory.prototype, "quantity_used", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", default: 0 }),
    __metadata("design:type", Number)
], Inventory.prototype, "minimum_stock", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Inventory.prototype, "sku", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Inventory.prototype, "barcode", void 0);
__decorate([
    (0, typeorm_1.Column)("text", { array: true, default: [] }),
    __metadata("design:type", Array)
], Inventory.prototype, "tags", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Inventory.prototype, "is_active", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Inventory.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Inventory.prototype, "project_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => project_entity_1.Project, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: "project_id" }),
    __metadata("design:type", project_entity_1.Project)
], Inventory.prototype, "project", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Inventory.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: "created_by" }),
    __metadata("design:type", user_entity_1.User)
], Inventory.prototype, "creator", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Inventory.prototype, "source_document", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Inventory.prototype, "picture_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Inventory.prototype, "invoice_url", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Inventory.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Inventory.prototype, "updated_at", void 0);
exports.Inventory = Inventory = __decorate([
    (0, typeorm_1.Entity)("inventory")
], Inventory);
//# sourceMappingURL=inventory.entity.js.map