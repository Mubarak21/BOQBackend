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
exports.Penalty = exports.PenaltyStatus = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const project_entity_1 = require("./project.entity");
const phase_entity_1 = require("./phase.entity");
const complaint_entity_1 = require("./complaint.entity");
var PenaltyStatus;
(function (PenaltyStatus) {
    PenaltyStatus["PENDING"] = "pending";
    PenaltyStatus["PAID"] = "paid";
    PenaltyStatus["APPEALED"] = "appealed";
    PenaltyStatus["WAIVED"] = "waived";
})(PenaltyStatus || (exports.PenaltyStatus = PenaltyStatus = {}));
let Penalty = class Penalty {
};
exports.Penalty = Penalty;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Penalty.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Penalty.prototype, "project_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Penalty.prototype, "phase_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Penalty.prototype, "complaint_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "decimal", precision: 15, scale: 2 }),
    __metadata("design:type", Number)
], Penalty.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], Penalty.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: PenaltyStatus,
        default: PenaltyStatus.PENDING,
    }),
    __metadata("design:type", String)
], Penalty.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Penalty.prototype, "assigned_to", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Penalty.prototype, "assigned_by", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], Penalty.prototype, "appeal_reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamp", nullable: true }),
    __metadata("design:type", Date)
], Penalty.prototype, "appealed_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamp", nullable: true }),
    __metadata("design:type", Date)
], Penalty.prototype, "paid_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Penalty.prototype, "evidence_image_url", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Penalty.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Penalty.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => project_entity_1.Project, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "project_id" }),
    __metadata("design:type", project_entity_1.Project)
], Penalty.prototype, "project", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => phase_entity_1.Phase, { onDelete: "CASCADE", nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: "phase_id" }),
    __metadata("design:type", phase_entity_1.Phase)
], Penalty.prototype, "phase", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => complaint_entity_1.Complaint, { onDelete: "SET NULL", nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: "complaint_id" }),
    __metadata("design:type", complaint_entity_1.Complaint)
], Penalty.prototype, "complaint", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: "assigned_to" }),
    __metadata("design:type", user_entity_1.User)
], Penalty.prototype, "assignee", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: "assigned_by" }),
    __metadata("design:type", user_entity_1.User)
], Penalty.prototype, "assigner", void 0);
exports.Penalty = Penalty = __decorate([
    (0, typeorm_1.Entity)("penalties")
], Penalty);
//# sourceMappingURL=penalty.entity.js.map