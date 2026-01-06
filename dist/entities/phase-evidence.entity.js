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
exports.PhaseEvidence = exports.EvidenceType = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const phase_entity_1 = require("./phase.entity");
const sub_phase_entity_1 = require("./sub-phase.entity");
var EvidenceType;
(function (EvidenceType) {
    EvidenceType["PHOTO"] = "photo";
    EvidenceType["VIDEO"] = "video";
    EvidenceType["NOTE"] = "note";
    EvidenceType["DOCUMENT"] = "document";
})(EvidenceType || (exports.EvidenceType = EvidenceType = {}));
let PhaseEvidence = class PhaseEvidence {
};
exports.PhaseEvidence = PhaseEvidence;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], PhaseEvidence.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PhaseEvidence.prototype, "phase_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PhaseEvidence.prototype, "sub_phase_id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: EvidenceType,
    }),
    __metadata("design:type", String)
], PhaseEvidence.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], PhaseEvidence.prototype, "file_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], PhaseEvidence.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PhaseEvidence.prototype, "uploaded_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], PhaseEvidence.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => phase_entity_1.Phase, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "phase_id" }),
    __metadata("design:type", phase_entity_1.Phase)
], PhaseEvidence.prototype, "phase", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => sub_phase_entity_1.SubPhase, { onDelete: "CASCADE", nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: "sub_phase_id" }),
    __metadata("design:type", sub_phase_entity_1.SubPhase)
], PhaseEvidence.prototype, "subPhase", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: "uploaded_by" }),
    __metadata("design:type", user_entity_1.User)
], PhaseEvidence.prototype, "uploader", void 0);
exports.PhaseEvidence = PhaseEvidence = __decorate([
    (0, typeorm_1.Entity)("phase_evidence")
], PhaseEvidence);
//# sourceMappingURL=phase-evidence.entity.js.map