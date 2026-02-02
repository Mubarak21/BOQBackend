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
exports.Equipment = exports.EquipmentStatus = exports.EquipmentCategory = void 0;
const typeorm_1 = require("typeorm");
const project_entity_1 = require("./project.entity");
var EquipmentCategory;
(function (EquipmentCategory) {
    EquipmentCategory["MACHINERY"] = "machinery";
    EquipmentCategory["VEHICLES"] = "vehicles";
    EquipmentCategory["TOOLS"] = "tools";
    EquipmentCategory["OTHER"] = "other";
})(EquipmentCategory || (exports.EquipmentCategory = EquipmentCategory = {}));
var EquipmentStatus;
(function (EquipmentStatus) {
    EquipmentStatus["IN_USE"] = "in_use";
    EquipmentStatus["AVAILABLE"] = "available";
    EquipmentStatus["MAINTENANCE"] = "maintenance";
})(EquipmentStatus || (exports.EquipmentStatus = EquipmentStatus = {}));
let Equipment = class Equipment {
};
exports.Equipment = Equipment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Equipment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "project_id" }),
    __metadata("design:type", String)
], Equipment.prototype, "project_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => project_entity_1.Project, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "project_id" }),
    __metadata("design:type", project_entity_1.Project)
], Equipment.prototype, "project", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255 }),
    __metadata("design:type", String)
], Equipment.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], Equipment.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", default: 1 }),
    __metadata("design:type", Number)
], Equipment.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: EquipmentCategory,
        default: EquipmentCategory.OTHER,
    }),
    __metadata("design:type", String)
], Equipment.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: EquipmentStatus,
        default: EquipmentStatus.AVAILABLE,
    }),
    __metadata("design:type", String)
], Equipment.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255, nullable: true, name: "serial_number" }),
    __metadata("design:type", String)
], Equipment.prototype, "serial_number", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at" }),
    __metadata("design:type", Date)
], Equipment.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: "updated_at" }),
    __metadata("design:type", Date)
], Equipment.prototype, "updated_at", void 0);
exports.Equipment = Equipment = __decorate([
    (0, typeorm_1.Entity)("equipment")
], Equipment);
//# sourceMappingURL=equipment.entity.js.map