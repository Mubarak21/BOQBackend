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
exports.BudgetAlert = exports.AlertType = void 0;
const typeorm_1 = require("typeorm");
const project_entity_1 = require("../../entities/project.entity");
var AlertType;
(function (AlertType) {
    AlertType["WARNING"] = "warning";
    AlertType["CRITICAL"] = "critical";
    AlertType["OVER_BUDGET"] = "over_budget";
})(AlertType || (exports.AlertType = AlertType = {}));
let BudgetAlert = class BudgetAlert {
    get isResolved() {
        return this.resolvedAt !== null;
    }
    get severityLevel() {
        switch (this.alertType) {
            case AlertType.WARNING:
                return "low";
            case AlertType.CRITICAL:
                return "medium";
            case AlertType.OVER_BUDGET:
                return "high";
            default:
                return "medium";
        }
    }
};
exports.BudgetAlert = BudgetAlert;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], BudgetAlert.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "project_id" }),
    __metadata("design:type", String)
], BudgetAlert.prototype, "projectId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => project_entity_1.Project, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "project_id" }),
    __metadata("design:type", project_entity_1.Project)
], BudgetAlert.prototype, "project", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: AlertType,
        name: "alert_type",
    }),
    __metadata("design:type", String)
], BudgetAlert.prototype, "alertType", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "decimal",
        precision: 5,
        scale: 2,
        name: "threshold_percentage",
    }),
    __metadata("design:type", Number)
], BudgetAlert.prototype, "thresholdPercentage", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "decimal",
        precision: 5,
        scale: 2,
        name: "current_percentage",
    }),
    __metadata("design:type", Number)
], BudgetAlert.prototype, "currentPercentage", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "triggered_at" }),
    __metadata("design:type", Date)
], BudgetAlert.prototype, "triggeredAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamp", nullable: true, name: "resolved_at" }),
    __metadata("design:type", Date)
], BudgetAlert.prototype, "resolvedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: false, name: "notification_sent" }),
    __metadata("design:type", Boolean)
], BudgetAlert.prototype, "notificationSent", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "text",
        array: true,
        nullable: true,
        name: "email_recipients",
    }),
    __metadata("design:type", Array)
], BudgetAlert.prototype, "emailRecipients", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: true, name: "is_active" }),
    __metadata("design:type", Boolean)
], BudgetAlert.prototype, "isActive", void 0);
exports.BudgetAlert = BudgetAlert = __decorate([
    (0, typeorm_1.Entity)("budget_alerts")
], BudgetAlert);
//# sourceMappingURL=budget-alert.entity.js.map