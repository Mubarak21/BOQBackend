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
exports.Phase = exports.PhaseStatus = void 0;
const typeorm_1 = require("typeorm");
const project_entity_1 = require("./project.entity");
const task_entity_1 = require("./task.entity");
const sub_phase_entity_1 = require("./sub-phase.entity");
const phase_financial_summary_entity_1 = require("./phase-financial-summary.entity");
var PhaseStatus;
(function (PhaseStatus) {
    PhaseStatus["NOT_STARTED"] = "not_started";
    PhaseStatus["IN_PROGRESS"] = "in_progress";
    PhaseStatus["COMPLETED"] = "completed";
    PhaseStatus["DELAYED"] = "delayed";
})(PhaseStatus || (exports.PhaseStatus = PhaseStatus = {}));
let Phase = class Phase {
};
exports.Phase = Phase;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Phase.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Phase.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Phase.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date", nullable: true }),
    __metadata("design:type", Date)
], Phase.prototype, "start_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamp", nullable: true }),
    __metadata("design:type", Date)
], Phase.prototype, "end_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "decimal", precision: 15, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], Phase.prototype, "budget", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "decimal", precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], Phase.prototype, "progress", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: PhaseStatus,
        default: PhaseStatus.NOT_STARTED,
    }),
    __metadata("design:type", String)
], Phase.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => project_entity_1.Project, (project) => project.phases, {
        onDelete: "CASCADE",
    }),
    (0, typeorm_1.JoinColumn)({ name: "project_id" }),
    __metadata("design:type", project_entity_1.Project)
], Phase.prototype, "project", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Phase.prototype, "project_id", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => task_entity_1.Task, (task) => task.phase),
    __metadata("design:type", Array)
], Phase.prototype, "tasks", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Phase.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Phase.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Phase.prototype, "deliverables", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Phase.prototype, "requirements", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamp", nullable: true }),
    __metadata("design:type", Date)
], Phase.prototype, "due_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Phase.prototype, "reference_task_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: true }),
    __metadata("design:type", Boolean)
], Phase.prototype, "is_active", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], Phase.prototype, "from_boq", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: ["contractor", "sub_contractor"],
        nullable: true,
        name: "boq_type",
    }),
    __metadata("design:type", String)
], Phase.prototype, "boqType", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, name: "linked_contractor_phase_id" }),
    __metadata("design:type", String)
], Phase.prototype, "linkedContractorPhaseId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Phase, (phase) => phase.linkedSubContractorPhases, {
        nullable: true,
    }),
    (0, typeorm_1.JoinColumn)({ name: "linked_contractor_phase_id" }),
    __metadata("design:type", Phase)
], Phase.prototype, "linkedContractorPhase", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Phase, (phase) => phase.linkedContractorPhase),
    __metadata("design:type", Array)
], Phase.prototype, "linkedSubContractorPhases", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => sub_phase_entity_1.SubPhase, (subPhase) => subPhase.phase, {
        cascade: true,
        eager: true,
    }),
    __metadata("design:type", Array)
], Phase.prototype, "subPhases", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => phase_financial_summary_entity_1.PhaseFinancialSummary, (summary) => summary.phase, {
        cascade: true,
    }),
    __metadata("design:type", phase_financial_summary_entity_1.PhaseFinancialSummary)
], Phase.prototype, "financialSummary", void 0);
exports.Phase = Phase = __decorate([
    (0, typeorm_1.Entity)()
], Phase);
//# sourceMappingURL=phase.entity.js.map