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
exports.Complaint = exports.ComplaintStatus = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const project_entity_1 = require("./project.entity");
const phase_entity_1 = require("./phase.entity");
const sub_phase_entity_1 = require("./sub-phase.entity");
var ComplaintStatus;
(function (ComplaintStatus) {
    ComplaintStatus["OPEN"] = "open";
    ComplaintStatus["RESOLVED"] = "resolved";
    ComplaintStatus["APPEALED"] = "appealed";
})(ComplaintStatus || (exports.ComplaintStatus = ComplaintStatus = {}));
let Complaint = class Complaint {
};
exports.Complaint = Complaint;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Complaint.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Complaint.prototype, "project_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Complaint.prototype, "phase_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Complaint.prototype, "sub_phase_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Complaint.prototype, "raised_by", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Complaint.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], Complaint.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: ComplaintStatus,
        default: ComplaintStatus.OPEN,
    }),
    __metadata("design:type", String)
], Complaint.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], Complaint.prototype, "response", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Complaint.prototype, "responded_by", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamp", nullable: true }),
    __metadata("design:type", Date)
], Complaint.prototype, "responded_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], Complaint.prototype, "appeal_reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamp", nullable: true }),
    __metadata("design:type", Date)
], Complaint.prototype, "appealed_at", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Complaint.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Complaint.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "raised_by" }),
    __metadata("design:type", user_entity_1.User)
], Complaint.prototype, "raiser", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => project_entity_1.Project, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "project_id" }),
    __metadata("design:type", project_entity_1.Project)
], Complaint.prototype, "project", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => phase_entity_1.Phase, { onDelete: "CASCADE", nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: "phase_id" }),
    __metadata("design:type", phase_entity_1.Phase)
], Complaint.prototype, "phase", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => sub_phase_entity_1.SubPhase, { onDelete: "CASCADE", nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: "sub_phase_id" }),
    __metadata("design:type", sub_phase_entity_1.SubPhase)
], Complaint.prototype, "subPhase", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: "responded_by" }),
    __metadata("design:type", user_entity_1.User)
], Complaint.prototype, "responder", void 0);
exports.Complaint = Complaint = __decorate([
    (0, typeorm_1.Entity)("complaints")
], Complaint);
//# sourceMappingURL=complaint.entity.js.map