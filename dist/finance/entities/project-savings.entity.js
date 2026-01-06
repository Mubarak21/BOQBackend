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
exports.ProjectSavings = exports.VerificationStatus = void 0;
const typeorm_1 = require("typeorm");
const project_entity_1 = require("../../entities/project.entity");
const user_entity_1 = require("../../entities/user.entity");
var VerificationStatus;
(function (VerificationStatus) {
    VerificationStatus["PENDING"] = "pending";
    VerificationStatus["VERIFIED"] = "verified";
    VerificationStatus["DISPUTED"] = "disputed";
})(VerificationStatus || (exports.VerificationStatus = VerificationStatus = {}));
let ProjectSavings = class ProjectSavings {
    get savedAmount() {
        return this.budgetedAmount - this.actualAmount;
    }
    get savingsPercentage() {
        return this.budgetedAmount > 0
            ? ((this.budgetedAmount - this.actualAmount) / this.budgetedAmount) * 100
            : 0;
    }
};
exports.ProjectSavings = ProjectSavings;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], ProjectSavings.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "project_id" }),
    __metadata("design:type", String)
], ProjectSavings.prototype, "projectId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => project_entity_1.Project, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "project_id" }),
    __metadata("design:type", project_entity_1.Project)
], ProjectSavings.prototype, "project", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], ProjectSavings.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "decimal", precision: 15, scale: 2, name: "budgeted_amount" }),
    __metadata("design:type", Number)
], ProjectSavings.prototype, "budgetedAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "decimal", precision: 15, scale: 2, name: "actual_amount" }),
    __metadata("design:type", Number)
], ProjectSavings.prototype, "actualAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], ProjectSavings.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], ProjectSavings.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date", nullable: true, name: "achieved_date" }),
    __metadata("design:type", Date)
], ProjectSavings.prototype, "achievedDate", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: VerificationStatus,
        default: VerificationStatus.PENDING,
        name: "verification_status",
    }),
    __metadata("design:type", String)
], ProjectSavings.prototype, "verificationStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "verified_by", nullable: true }),
    __metadata("design:type", String)
], ProjectSavings.prototype, "verifiedBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: "verified_by" }),
    __metadata("design:type", user_entity_1.User)
], ProjectSavings.prototype, "verifier", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at" }),
    __metadata("design:type", Date)
], ProjectSavings.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "created_by" }),
    __metadata("design:type", String)
], ProjectSavings.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: "created_by" }),
    __metadata("design:type", user_entity_1.User)
], ProjectSavings.prototype, "creator", void 0);
exports.ProjectSavings = ProjectSavings = __decorate([
    (0, typeorm_1.Entity)("project_savings")
], ProjectSavings);
//# sourceMappingURL=project-savings.entity.js.map