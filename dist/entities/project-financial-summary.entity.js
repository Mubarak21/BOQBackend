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
exports.ProjectFinancialSummary = void 0;
const typeorm_1 = require("typeorm");
const project_entity_1 = require("./project.entity");
let ProjectFinancialSummary = class ProjectFinancialSummary {
};
exports.ProjectFinancialSummary = ProjectFinancialSummary;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], ProjectFinancialSummary.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], ProjectFinancialSummary.prototype, "project_id", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => project_entity_1.Project, (project) => project.financialSummary, {
        onDelete: "CASCADE",
    }),
    (0, typeorm_1.JoinColumn)({ name: "project_id" }),
    __metadata("design:type", project_entity_1.Project)
], ProjectFinancialSummary.prototype, "project", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "decimal",
        precision: 15,
        scale: 2,
        default: 0.0,
        name: "total_budget",
    }),
    __metadata("design:type", Number)
], ProjectFinancialSummary.prototype, "totalBudget", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "decimal",
        precision: 15,
        scale: 2,
        default: 0.0,
        name: "allocated_budget",
    }),
    __metadata("design:type", Number)
], ProjectFinancialSummary.prototype, "allocatedBudget", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "decimal",
        precision: 15,
        scale: 2,
        default: 0.0,
        name: "spent_amount",
    }),
    __metadata("design:type", Number)
], ProjectFinancialSummary.prototype, "spentAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "decimal",
        precision: 15,
        scale: 2,
        default: 0.0,
        name: "estimated_savings",
    }),
    __metadata("design:type", Number)
], ProjectFinancialSummary.prototype, "estimatedSavings", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "decimal",
        precision: 15,
        scale: 2,
        default: 0.0,
        name: "received_amount",
    }),
    __metadata("design:type", Number)
], ProjectFinancialSummary.prototype, "receivedAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "decimal",
        precision: 15,
        scale: 2,
        default: 0.0,
        name: "paid_amount",
    }),
    __metadata("design:type", Number)
], ProjectFinancialSummary.prototype, "paidAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "decimal",
        precision: 15,
        scale: 2,
        default: 0.0,
        name: "net_cash_flow",
    }),
    __metadata("design:type", Number)
], ProjectFinancialSummary.prototype, "netCashFlow", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: ["on_track", "warning", "over_budget", "excellent"],
        default: "on_track",
        name: "financial_status",
    }),
    __metadata("design:type", String)
], ProjectFinancialSummary.prototype, "financialStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "timestamp",
        nullable: true,
        name: "budget_last_updated",
    }),
    __metadata("design:type", Date)
], ProjectFinancialSummary.prototype, "budgetLastUpdated", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "timestamp",
        nullable: true,
        name: "last_transaction_date",
    }),
    __metadata("design:type", Date)
], ProjectFinancialSummary.prototype, "lastTransactionDate", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at" }),
    __metadata("design:type", Date)
], ProjectFinancialSummary.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: "updated_at" }),
    __metadata("design:type", Date)
], ProjectFinancialSummary.prototype, "updatedAt", void 0);
exports.ProjectFinancialSummary = ProjectFinancialSummary = __decorate([
    (0, typeorm_1.Entity)("project_financial_summaries")
], ProjectFinancialSummary);
//# sourceMappingURL=project-financial-summary.entity.js.map