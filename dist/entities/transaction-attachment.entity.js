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
exports.TransactionAttachment = exports.AttachmentType = void 0;
const typeorm_1 = require("typeorm");
const project_transaction_entity_1 = require("../finance/entities/project-transaction.entity");
const user_entity_1 = require("./user.entity");
var AttachmentType;
(function (AttachmentType) {
    AttachmentType["RECEIPT"] = "receipt";
    AttachmentType["INVOICE"] = "invoice";
    AttachmentType["QUOTE"] = "quote";
    AttachmentType["CONTRACT"] = "contract";
    AttachmentType["OTHER"] = "other";
})(AttachmentType || (exports.AttachmentType = AttachmentType = {}));
let TransactionAttachment = class TransactionAttachment {
};
exports.TransactionAttachment = TransactionAttachment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], TransactionAttachment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "transaction_id" }),
    __metadata("design:type", String)
], TransactionAttachment.prototype, "transactionId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => project_transaction_entity_1.ProjectTransaction, (transaction) => transaction.attachments, {
        onDelete: "CASCADE",
    }),
    (0, typeorm_1.JoinColumn)({ name: "transaction_id" }),
    __metadata("design:type", project_transaction_entity_1.ProjectTransaction)
], TransactionAttachment.prototype, "transaction", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: AttachmentType,
        default: AttachmentType.RECEIPT,
    }),
    __metadata("design:type", String)
], TransactionAttachment.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], TransactionAttachment.prototype, "file_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TransactionAttachment.prototype, "file_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TransactionAttachment.prototype, "file_mime_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "bigint", nullable: true }),
    __metadata("design:type", Number)
], TransactionAttachment.prototype, "file_size", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], TransactionAttachment.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "uploaded_by" }),
    __metadata("design:type", String)
], TransactionAttachment.prototype, "uploadedBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: "uploaded_by" }),
    __metadata("design:type", user_entity_1.User)
], TransactionAttachment.prototype, "uploader", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at" }),
    __metadata("design:type", Date)
], TransactionAttachment.prototype, "createdAt", void 0);
exports.TransactionAttachment = TransactionAttachment = __decorate([
    (0, typeorm_1.Entity)("transaction_attachments")
], TransactionAttachment);
//# sourceMappingURL=transaction-attachment.entity.js.map