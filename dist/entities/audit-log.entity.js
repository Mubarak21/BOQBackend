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
exports.AuditLog = exports.AuditEntityType = exports.AuditAction = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
var AuditAction;
(function (AuditAction) {
    AuditAction["CREATE"] = "create";
    AuditAction["UPDATE"] = "update";
    AuditAction["DELETE"] = "delete";
    AuditAction["VIEW"] = "view";
    AuditAction["EXPORT"] = "export";
    AuditAction["APPROVE"] = "approve";
    AuditAction["REJECT"] = "reject";
    AuditAction["LOGIN"] = "login";
    AuditAction["LOGOUT"] = "logout";
    AuditAction["PASSWORD_CHANGE"] = "password_change";
    AuditAction["PERMISSION_CHANGE"] = "permission_change";
})(AuditAction || (exports.AuditAction = AuditAction = {}));
var AuditEntityType;
(function (AuditEntityType) {
    AuditEntityType["USER"] = "user";
    AuditEntityType["PROJECT"] = "project";
    AuditEntityType["PHASE"] = "phase";
    AuditEntityType["TASK"] = "task";
    AuditEntityType["TRANSACTION"] = "transaction";
    AuditEntityType["INVENTORY"] = "inventory";
    AuditEntityType["BUDGET"] = "budget";
    AuditEntityType["REPORT"] = "report";
    AuditEntityType["COMPLAINT"] = "complaint";
})(AuditEntityType || (exports.AuditEntityType = AuditEntityType = {}));
let AuditLog = class AuditLog {
};
exports.AuditLog = AuditLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], AuditLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: AuditAction,
    }),
    __metadata("design:type", String)
], AuditLog.prototype, "action", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: AuditEntityType,
    }),
    __metadata("design:type", String)
], AuditLog.prototype, "entity_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "entity_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "user_id", nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: "user_id" }),
    __metadata("design:type", user_entity_1.User)
], AuditLog.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], AuditLog.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "jsonb", nullable: true }),
    __metadata("design:type", Object)
], AuditLog.prototype, "old_values", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "jsonb", nullable: true }),
    __metadata("design:type", Object)
], AuditLog.prototype, "new_values", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "ip_address", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "user_agent", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], AuditLog.prototype, "is_successful", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "error_message", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at" }),
    __metadata("design:type", Date)
], AuditLog.prototype, "createdAt", void 0);
exports.AuditLog = AuditLog = __decorate([
    (0, typeorm_1.Entity)("audit_logs"),
    (0, typeorm_1.Index)(["entity_type", "entity_id"]),
    (0, typeorm_1.Index)(["userId", "createdAt"]),
    (0, typeorm_1.Index)(["action", "createdAt"])
], AuditLog);
//# sourceMappingURL=audit-log.entity.js.map