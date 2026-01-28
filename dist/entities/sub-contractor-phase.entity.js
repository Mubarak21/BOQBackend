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
exports.SubContractorPhase = void 0;
const typeorm_1 = require("typeorm");
const project_entity_1 = require("./project.entity");
const task_entity_1 = require("./task.entity");
const sub_phase_entity_1 = require("./sub-phase.entity");
const phase_financial_summary_entity_1 = require("./phase-financial-summary.entity");
const phase_entity_1 = require("./phase.entity");
let SubContractorPhase = class SubContractorPhase {
};
exports.SubContractorPhase = SubContractorPhase;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], SubContractorPhase.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], SubContractorPhase.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], SubContractorPhase.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date", nullable: true }),
    __metadata("design:type", Date)
], SubContractorPhase.prototype, "start_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamp", nullable: true }),
    __metadata("design:type", Date)
], SubContractorPhase.prototype, "end_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "decimal", precision: 15, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], SubContractorPhase.prototype, "budget", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "decimal", precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], SubContractorPhase.prototype, "progress", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: ["not_started", "in_progress", "completed", "delayed"],
        default: "not_started",
    }),
    __metadata("design:type", String)
], SubContractorPhase.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => project_entity_1.Project, {
        onDelete: "CASCADE",
    }),
    (0, typeorm_1.JoinColumn)({ name: "project_id" }),
    __metadata("design:type", project_entity_1.Project)
], SubContractorPhase.prototype, "project", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SubContractorPhase.prototype, "project_id", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => task_entity_1.Task, (task) => task.subContractorPhase),
    __metadata("design:type", Array)
], SubContractorPhase.prototype, "tasks", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], SubContractorPhase.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], SubContractorPhase.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], SubContractorPhase.prototype, "deliverables", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], SubContractorPhase.prototype, "requirements", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamp", nullable: true }),
    __metadata("design:type", Date)
], SubContractorPhase.prototype, "due_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], SubContractorPhase.prototype, "reference_task_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: true }),
    __metadata("design:type", Boolean)
], SubContractorPhase.prototype, "is_active", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], SubContractorPhase.prototype, "from_boq", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, name: "linked_contractor_phase_id" }),
    __metadata("design:type", String)
], SubContractorPhase.prototype, "linkedContractorPhaseId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)("ContractorPhase", "linkedSubContractorPhases", {
        nullable: true,
    }),
    (0, typeorm_1.JoinColumn)({ name: "linked_contractor_phase_id" }),
    __metadata("design:type", Object)
], SubContractorPhase.prototype, "linkedContractorPhase", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => sub_phase_entity_1.SubPhase, (subPhase) => subPhase.subContractorPhase, {
        cascade: true,
        eager: true,
    }),
    __metadata("design:type", Array)
], SubContractorPhase.prototype, "subPhases", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => phase_financial_summary_entity_1.PhaseFinancialSummary, (summary) => summary.subContractorPhase, {
        cascade: true,
    }),
    __metadata("design:type", phase_financial_summary_entity_1.PhaseFinancialSummary)
], SubContractorPhase.prototype, "financialSummary", void 0);
exports.SubContractorPhase = SubContractorPhase = __decorate([
    (0, typeorm_1.Entity)("sub_contractor_phases")
], SubContractorPhase);
//# sourceMappingURL=sub-contractor-phase.entity.js.map