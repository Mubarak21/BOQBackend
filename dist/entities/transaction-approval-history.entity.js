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
exports.TransactionApprovalHistory = exports.ApprovalAction = void 0;
const typeorm_1 = require("typeorm");
const project_transaction_entity_1 = require("../finance/entities/project-transaction.entity");
const user_entity_1 = require("./user.entity");
var ApprovalAction;
(function (ApprovalAction) {
    ApprovalAction["APPROVED"] = "approved";
    ApprovalAction["REJECTED"] = "rejected";
    ApprovalAction["PENDING"] = "pending";
    ApprovalAction["REQUESTED_CHANGES"] = "requested_changes";
})(ApprovalAction || (exports.ApprovalAction = ApprovalAction = {}));
let TransactionApprovalHistory = class TransactionApprovalHistory {
};
exports.TransactionApprovalHistory = TransactionApprovalHistory;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], TransactionApprovalHistory.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "transaction_id" }),
    __metadata("design:type", String)
], TransactionApprovalHistory.prototype, "transactionId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => project_transaction_entity_1.ProjectTransaction, (transaction) => transaction.approvalHistory, {
        onDelete: "CASCADE",
    }),
    (0, typeorm_1.JoinColumn)({ name: "transaction_id" }),
    __metadata("design:type", project_transaction_entity_1.ProjectTransaction)
], TransactionApprovalHistory.prototype, "transaction", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: ApprovalAction,
    }),
    __metadata("design:type", String)
], TransactionApprovalHistory.prototype, "action", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "action_by", nullable: true }),
    __metadata("design:type", String)
], TransactionApprovalHistory.prototype, "actionBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: "action_by" }),
    __metadata("design:type", user_entity_1.User)
], TransactionApprovalHistory.prototype, "actor", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], TransactionApprovalHistory.prototype, "comment", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], TransactionApprovalHistory.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at" }),
    __metadata("design:type", Date)
], TransactionApprovalHistory.prototype, "createdAt", void 0);
exports.TransactionApprovalHistory = TransactionApprovalHistory = __decorate([
    (0, typeorm_1.Entity)("transaction_approval_history")
], TransactionApprovalHistory);
//# sourceMappingURL=transaction-approval-history.entity.js.map