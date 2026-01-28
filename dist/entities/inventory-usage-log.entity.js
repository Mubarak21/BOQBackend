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
exports.InventoryUsageLog = exports.UsageType = void 0;
const typeorm_1 = require("typeorm");
const inventory_entity_1 = require("./inventory.entity");
const project_entity_1 = require("./project.entity");
const phase_entity_1 = require("./phase.entity");
const user_entity_1 = require("./user.entity");
var UsageType;
(function (UsageType) {
    UsageType["USED"] = "used";
    UsageType["RETURNED"] = "returned";
    UsageType["DAMAGED"] = "damaged";
    UsageType["LOST"] = "lost";
    UsageType["ADJUSTMENT"] = "adjustment";
})(UsageType || (exports.UsageType = UsageType = {}));
let InventoryUsageLog = class InventoryUsageLog {
};
exports.InventoryUsageLog = InventoryUsageLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], InventoryUsageLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "inventory_id" }),
    __metadata("design:type", String)
], InventoryUsageLog.prototype, "inventoryId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => inventory_entity_1.Inventory, (inventory) => inventory.usageLogs, {
        onDelete: "CASCADE",
    }),
    (0, typeorm_1.JoinColumn)({ name: "inventory_id" }),
    __metadata("design:type", inventory_entity_1.Inventory)
], InventoryUsageLog.prototype, "inventory", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "project_id", nullable: true }),
    __metadata("design:type", String)
], InventoryUsageLog.prototype, "projectId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => project_entity_1.Project, { nullable: true, onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "project_id" }),
    __metadata("design:type", project_entity_1.Project)
], InventoryUsageLog.prototype, "project", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "phase_id", nullable: true }),
    __metadata("design:type", String)
], InventoryUsageLog.prototype, "phaseId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => phase_entity_1.Phase, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: "phase_id" }),
    __metadata("design:type", phase_entity_1.Phase)
], InventoryUsageLog.prototype, "phase", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: UsageType,
    }),
    __metadata("design:type", String)
], InventoryUsageLog.prototype, "usage_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int" }),
    __metadata("design:type", Number)
], InventoryUsageLog.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "decimal", precision: 15, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], InventoryUsageLog.prototype, "unit_price", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "decimal", precision: 15, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], InventoryUsageLog.prototype, "total_cost", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], InventoryUsageLog.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "recorded_by" }),
    __metadata("design:type", String)
], InventoryUsageLog.prototype, "recordedBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: "recorded_by" }),
    __metadata("design:type", user_entity_1.User)
], InventoryUsageLog.prototype, "recorder", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date" }),
    __metadata("design:type", Date)
], InventoryUsageLog.prototype, "usage_date", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at" }),
    __metadata("design:type", Date)
], InventoryUsageLog.prototype, "createdAt", void 0);
exports.InventoryUsageLog = InventoryUsageLog = __decorate([
    (0, typeorm_1.Entity)("inventory_usage_logs"),
    (0, typeorm_1.Index)(["inventoryId", "createdAt"]),
    (0, typeorm_1.Index)(["projectId", "createdAt"])
], InventoryUsageLog);
//# sourceMappingURL=inventory-usage-log.entity.js.map