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
exports.SubPhase = void 0;
const typeorm_1 = require("typeorm");
const phase_entity_1 = require("./phase.entity");
let SubPhase = class SubPhase {
};
exports.SubPhase = SubPhase;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], SubPhase.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SubPhase.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], SubPhase.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], SubPhase.prototype, "isCompleted", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => phase_entity_1.Phase, (phase) => phase.subPhases, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "phase_id" }),
    __metadata("design:type", phase_entity_1.Phase)
], SubPhase.prototype, "phase", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SubPhase.prototype, "phase_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => SubPhase, (subPhase) => subPhase.subPhases, { nullable: true, onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "parent_sub_phase_id" }),
    __metadata("design:type", SubPhase)
], SubPhase.prototype, "parentSubPhase", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], SubPhase.prototype, "parent_sub_phase_id", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => SubPhase, (subPhase) => subPhase.parentSubPhase),
    __metadata("design:type", Array)
], SubPhase.prototype, "subPhases", void 0);
exports.SubPhase = SubPhase = __decorate([
    (0, typeorm_1.Entity)()
], SubPhase);
//# sourceMappingURL=sub-phase.entity.js.map