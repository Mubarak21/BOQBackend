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
exports.ContractorPhase = void 0;
const typeorm_1 = require("typeorm");
const project_entity_1 = require("./project.entity");
const task_entity_1 = require("./task.entity");
const sub_phase_entity_1 = require("./sub-phase.entity");
const phase_financial_summary_entity_1 = require("./phase-financial-summary.entity");
const phase_entity_1 = require("./phase.entity");
let ContractorPhase = class ContractorPhase {
};
exports.ContractorPhase = ContractorPhase;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], ContractorPhase.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ContractorPhase.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ContractorPhase.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date", nullable: true }),
    __metadata("design:type", Date)
], ContractorPhase.prototype, "start_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamp", nullable: true }),
    __metadata("design:type", Date)
], ContractorPhase.prototype, "end_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "decimal", precision: 15, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], ContractorPhase.prototype, "budget", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "decimal", precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], ContractorPhase.prototype, "progress", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: ["not_started", "in_progress", "completed", "delayed"],
        default: "not_started",
    }),
    __metadata("design:type", String)
], ContractorPhase.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => project_entity_1.Project, {
        onDelete: "CASCADE",
    }),
    (0, typeorm_1.JoinColumn)({ name: "project_id" }),
    __metadata("design:type", project_entity_1.Project)
], ContractorPhase.prototype, "project", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ContractorPhase.prototype, "project_id", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => task_entity_1.Task, (task) => task.contractorPhase),
    __metadata("design:type", Array)
], ContractorPhase.prototype, "tasks", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ContractorPhase.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], ContractorPhase.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ContractorPhase.prototype, "deliverables", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ContractorPhase.prototype, "requirements", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamp", nullable: true }),
    __metadata("design:type", Date)
], ContractorPhase.prototype, "due_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ContractorPhase.prototype, "reference_task_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: true }),
    __metadata("design:type", Boolean)
], ContractorPhase.prototype, "is_active", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], ContractorPhase.prototype, "from_boq", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => sub_phase_entity_1.SubPhase, (subPhase) => subPhase.contractorPhase, {
        cascade: true,
        eager: true,
    }),
    __metadata("design:type", Array)
], ContractorPhase.prototype, "subPhases", void 0);
__decorate([
    (0, typeorm_1.OneToMany)("SubContractorPhase", "linkedContractorPhase"),
    __metadata("design:type", Array)
], ContractorPhase.prototype, "linkedSubContractorPhases", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => phase_financial_summary_entity_1.PhaseFinancialSummary, (summary) => summary.contractorPhase, {
        cascade: true,
    }),
    __metadata("design:type", phase_financial_summary_entity_1.PhaseFinancialSummary)
], ContractorPhase.prototype, "financialSummary", void 0);
exports.ContractorPhase = ContractorPhase = __decorate([
    (0, typeorm_1.Entity)("contractor_phases")
], ContractorPhase);
//# sourceMappingURL=contractor-phase.entity.js.map