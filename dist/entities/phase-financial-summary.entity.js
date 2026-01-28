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
exports.PhaseFinancialSummary = void 0;
const typeorm_1 = require("typeorm");
const phase_entity_1 = require("./phase.entity");
const contractor_phase_entity_1 = require("./contractor-phase.entity");
const sub_contractor_phase_entity_1 = require("./sub-contractor-phase.entity");
let PhaseFinancialSummary = class PhaseFinancialSummary {
};
exports.PhaseFinancialSummary = PhaseFinancialSummary;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], PhaseFinancialSummary.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PhaseFinancialSummary.prototype, "phase_id", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => phase_entity_1.Phase, (phase) => phase.financialSummary, {
        nullable: true,
        onDelete: "CASCADE",
    }),
    (0, typeorm_1.JoinColumn)({ name: "phase_id" }),
    __metadata("design:type", phase_entity_1.Phase)
], PhaseFinancialSummary.prototype, "phase", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, unique: true, name: "contractor_phase_id" }),
    __metadata("design:type", String)
], PhaseFinancialSummary.prototype, "contractorPhaseId", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => contractor_phase_entity_1.ContractorPhase, (phase) => phase.financialSummary, {
        nullable: true,
        onDelete: "CASCADE",
    }),
    (0, typeorm_1.JoinColumn)({ name: "contractor_phase_id" }),
    __metadata("design:type", contractor_phase_entity_1.ContractorPhase)
], PhaseFinancialSummary.prototype, "contractorPhase", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, unique: true, name: "sub_contractor_phase_id" }),
    __metadata("design:type", String)
], PhaseFinancialSummary.prototype, "subContractorPhaseId", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => sub_contractor_phase_entity_1.SubContractorPhase, (phase) => phase.financialSummary, {
        nullable: true,
        onDelete: "CASCADE",
    }),
    (0, typeorm_1.JoinColumn)({ name: "sub_contractor_phase_id" }),
    __metadata("design:type", sub_contractor_phase_entity_1.SubContractorPhase)
], PhaseFinancialSummary.prototype, "subContractorPhase", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "decimal",
        precision: 15,
        scale: 2,
        default: 0.0,
        name: "allocated_budget",
    }),
    __metadata("design:type", Number)
], PhaseFinancialSummary.prototype, "allocatedBudget", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "decimal",
        precision: 15,
        scale: 2,
        default: 0.0,
        name: "spent_amount",
    }),
    __metadata("design:type", Number)
], PhaseFinancialSummary.prototype, "spentAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "decimal",
        precision: 15,
        scale: 2,
        default: 0.0,
        name: "estimated_cost",
    }),
    __metadata("design:type", Number)
], PhaseFinancialSummary.prototype, "estimatedCost", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "decimal",
        precision: 15,
        scale: 2,
        default: 0.0,
        name: "actual_cost",
    }),
    __metadata("design:type", Number)
], PhaseFinancialSummary.prototype, "actualCost", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "decimal",
        precision: 15,
        scale: 2,
        default: 0.0,
        name: "variance",
    }),
    __metadata("design:type", Number)
], PhaseFinancialSummary.prototype, "variance", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: ["on_track", "warning", "over_budget"],
        default: "on_track",
        name: "financial_status",
    }),
    __metadata("design:type", String)
], PhaseFinancialSummary.prototype, "financialStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "timestamp",
        nullable: true,
        name: "last_updated",
    }),
    __metadata("design:type", Date)
], PhaseFinancialSummary.prototype, "lastUpdated", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at" }),
    __metadata("design:type", Date)
], PhaseFinancialSummary.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: "updated_at" }),
    __metadata("design:type", Date)
], PhaseFinancialSummary.prototype, "updatedAt", void 0);
exports.PhaseFinancialSummary = PhaseFinancialSummary = __decorate([
    (0, typeorm_1.Entity)("phase_financial_summaries")
], PhaseFinancialSummary);
//# sourceMappingURL=phase-financial-summary.entity.js.map