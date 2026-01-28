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
exports.PhaseSpending = void 0;
const typeorm_1 = require("typeorm");
const phase_entity_1 = require("./phase.entity");
const project_entity_1 = require("./project.entity");
let PhaseSpending = class PhaseSpending {
};
exports.PhaseSpending = PhaseSpending;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], PhaseSpending.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PhaseSpending.prototype, "phase_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => phase_entity_1.Phase),
    (0, typeorm_1.JoinColumn)({ name: "phase_id" }),
    __metadata("design:type", phase_entity_1.Phase)
], PhaseSpending.prototype, "phase", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PhaseSpending.prototype, "project_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => project_entity_1.Project, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "project_id" }),
    __metadata("design:type", project_entity_1.Project)
], PhaseSpending.prototype, "project", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "decimal", precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], PhaseSpending.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], PhaseSpending.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date", nullable: true }),
    __metadata("design:type", Date)
], PhaseSpending.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], PhaseSpending.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], PhaseSpending.prototype, "updated_at", void 0);
exports.PhaseSpending = PhaseSpending = __decorate([
    (0, typeorm_1.Entity)()
], PhaseSpending);
//# sourceMappingURL=phase-spending.entity.js.map