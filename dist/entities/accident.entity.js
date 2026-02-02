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
exports.Accident = exports.AccidentStatus = exports.AccidentSeverity = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const project_entity_1 = require("./project.entity");
var AccidentSeverity;
(function (AccidentSeverity) {
    AccidentSeverity["MINOR"] = "minor";
    AccidentSeverity["MODERATE"] = "moderate";
    AccidentSeverity["SERIOUS"] = "serious";
    AccidentSeverity["FATAL"] = "fatal";
})(AccidentSeverity || (exports.AccidentSeverity = AccidentSeverity = {}));
var AccidentStatus;
(function (AccidentStatus) {
    AccidentStatus["REPORTED"] = "reported";
    AccidentStatus["UNDER_REVIEW"] = "under_review";
    AccidentStatus["CLOSED"] = "closed";
})(AccidentStatus || (exports.AccidentStatus = AccidentStatus = {}));
let Accident = class Accident {
};
exports.Accident = Accident;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Accident.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "project_id" }),
    __metadata("design:type", String)
], Accident.prototype, "project_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => project_entity_1.Project, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "project_id" }),
    __metadata("design:type", project_entity_1.Project)
], Accident.prototype, "project", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "reported_by" }),
    __metadata("design:type", String)
], Accident.prototype, "reported_by", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: "reported_by" }),
    __metadata("design:type", user_entity_1.User)
], Accident.prototype, "reportedByUser", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date", name: "accident_date" }),
    __metadata("design:type", String)
], Accident.prototype, "accident_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], Accident.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: AccidentSeverity,
        default: AccidentSeverity.MODERATE,
    }),
    __metadata("design:type", String)
], Accident.prototype, "severity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 500, nullable: true }),
    __metadata("design:type", String)
], Accident.prototype, "location", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", name: "injured_count", default: 0 }),
    __metadata("design:type", Number)
], Accident.prototype, "injured_count", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", name: "action_taken", nullable: true }),
    __metadata("design:type", String)
], Accident.prototype, "action_taken", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: AccidentStatus,
        default: AccidentStatus.REPORTED,
    }),
    __metadata("design:type", String)
], Accident.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at" }),
    __metadata("design:type", Date)
], Accident.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: "updated_at" }),
    __metadata("design:type", Date)
], Accident.prototype, "updated_at", void 0);
exports.Accident = Accident = __decorate([
    (0, typeorm_1.Entity)("accidents")
], Accident);
//# sourceMappingURL=accident.entity.js.map