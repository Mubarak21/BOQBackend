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
exports.ProjectTransaction = exports.ApprovalStatus = exports.TransactionType = void 0;
const typeorm_1 = require("typeorm");
const project_entity_1 = require("../../entities/project.entity");
const user_entity_1 = require("../../entities/user.entity");
const budget_category_entity_1 = require("./budget-category.entity");
var TransactionType;
(function (TransactionType) {
    TransactionType["EXPENSE"] = "expense";
    TransactionType["REFUND"] = "refund";
    TransactionType["ADJUSTMENT"] = "adjustment";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
var ApprovalStatus;
(function (ApprovalStatus) {
    ApprovalStatus["PENDING"] = "pending";
    ApprovalStatus["APPROVED"] = "approved";
    ApprovalStatus["REJECTED"] = "rejected";
})(ApprovalStatus || (exports.ApprovalStatus = ApprovalStatus = {}));
let ProjectTransaction = class ProjectTransaction {
};
exports.ProjectTransaction = ProjectTransaction;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], ProjectTransaction.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "project_id" }),
    __metadata("design:type", String)
], ProjectTransaction.prototype, "projectId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => project_entity_1.Project, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "project_id" }),
    __metadata("design:type", project_entity_1.Project)
], ProjectTransaction.prototype, "project", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "category_id", nullable: true }),
    __metadata("design:type", String)
], ProjectTransaction.prototype, "categoryId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => budget_category_entity_1.BudgetCategory, { onDelete: "SET NULL" }),
    (0, typeorm_1.JoinColumn)({ name: "category_id" }),
    __metadata("design:type", budget_category_entity_1.BudgetCategory)
], ProjectTransaction.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, unique: true, name: "transaction_number" }),
    __metadata("design:type", String)
], ProjectTransaction.prototype, "transactionNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "decimal", precision: 15, scale: 2 }),
    __metadata("design:type", Number)
], ProjectTransaction.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: TransactionType,
    }),
    __metadata("design:type", String)
], ProjectTransaction.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], ProjectTransaction.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, nullable: true }),
    __metadata("design:type", String)
], ProjectTransaction.prototype, "vendor", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true, name: "invoice_number" }),
    __metadata("design:type", String)
], ProjectTransaction.prototype, "invoiceNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date", name: "transaction_date" }),
    __metadata("design:type", Date)
], ProjectTransaction.prototype, "transactionDate", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: ApprovalStatus,
        default: ApprovalStatus.PENDING,
        name: "approval_status",
    }),
    __metadata("design:type", String)
], ProjectTransaction.prototype, "approvalStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "approved_by", nullable: true }),
    __metadata("design:type", String)
], ProjectTransaction.prototype, "approvedBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: "approved_by" }),
    __metadata("design:type", user_entity_1.User)
], ProjectTransaction.prototype, "approver", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamp", nullable: true, name: "approved_at" }),
    __metadata("design:type", Date)
], ProjectTransaction.prototype, "approvedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500, nullable: true, name: "receipt_url" }),
    __metadata("design:type", String)
], ProjectTransaction.prototype, "receiptUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], ProjectTransaction.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at" }),
    __metadata("design:type", Date)
], ProjectTransaction.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: "updated_at" }),
    __metadata("design:type", Date)
], ProjectTransaction.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "created_by" }),
    __metadata("design:type", String)
], ProjectTransaction.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: "created_by" }),
    __metadata("design:type", user_entity_1.User)
], ProjectTransaction.prototype, "creator", void 0);
exports.ProjectTransaction = ProjectTransaction = __decorate([
    (0, typeorm_1.Entity)("project_transactions"),
    (0, typeorm_1.Check)(`"amount" > 0`)
], ProjectTransaction);
//# sourceMappingURL=project-transaction.entity.js.map