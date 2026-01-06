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
exports.BudgetCategory = void 0;
const typeorm_1 = require("typeorm");
const project_entity_1 = require("../../entities/project.entity");
const user_entity_1 = require("../../entities/user.entity");
const project_transaction_entity_1 = require("./project-transaction.entity");
let BudgetCategory = class BudgetCategory {
    get remainingAmount() {
        return this.budgetedAmount - this.spentAmount;
    }
    get utilizationPercentage() {
        return this.budgetedAmount > 0
            ? (this.spentAmount / this.budgetedAmount) * 100
            : 0;
    }
    get status() {
        const utilization = this.utilizationPercentage;
        if (utilization > 100)
            return "over_budget";
        if (utilization > 90)
            return "warning";
        return "on_track";
    }
};
exports.BudgetCategory = BudgetCategory;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], BudgetCategory.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "project_id" }),
    __metadata("design:type", String)
], BudgetCategory.prototype, "projectId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => project_entity_1.Project, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "project_id" }),
    __metadata("design:type", project_entity_1.Project)
], BudgetCategory.prototype, "project", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], BudgetCategory.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], BudgetCategory.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "decimal",
        precision: 15,
        scale: 2,
        default: 0.0,
        name: "budgeted_amount",
    }),
    __metadata("design:type", Number)
], BudgetCategory.prototype, "budgetedAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "decimal",
        precision: 15,
        scale: 2,
        default: 0.0,
        name: "spent_amount",
    }),
    __metadata("design:type", Number)
], BudgetCategory.prototype, "spentAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: true, name: "is_active" }),
    __metadata("design:type", Boolean)
], BudgetCategory.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at" }),
    __metadata("design:type", Date)
], BudgetCategory.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: "updated_at" }),
    __metadata("design:type", Date)
], BudgetCategory.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "created_by", nullable: true }),
    __metadata("design:type", String)
], BudgetCategory.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: "created_by" }),
    __metadata("design:type", user_entity_1.User)
], BudgetCategory.prototype, "creator", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => project_transaction_entity_1.ProjectTransaction, (transaction) => transaction.category),
    __metadata("design:type", Array)
], BudgetCategory.prototype, "transactions", void 0);
exports.BudgetCategory = BudgetCategory = __decorate([
    (0, typeorm_1.Entity)("budget_categories"),
    (0, typeorm_1.Check)(`"budgeted_amount" >= 0`),
    (0, typeorm_1.Check)(`"spent_amount" >= 0`)
], BudgetCategory);
//# sourceMappingURL=budget-category.entity.js.map