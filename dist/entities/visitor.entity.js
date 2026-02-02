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
exports.Visitor = exports.VisitorPriority = void 0;
const typeorm_1 = require("typeorm");
const project_entity_1 = require("./project.entity");
const user_entity_1 = require("./user.entity");
var VisitorPriority;
(function (VisitorPriority) {
    VisitorPriority["HIGH"] = "high";
    VisitorPriority["MEDIUM"] = "medium";
    VisitorPriority["LOW"] = "low";
})(VisitorPriority || (exports.VisitorPriority = VisitorPriority = {}));
let Visitor = class Visitor {
};
exports.Visitor = Visitor;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Visitor.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "project_id" }),
    __metadata("design:type", String)
], Visitor.prototype, "project_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => project_entity_1.Project, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "project_id" }),
    __metadata("design:type", project_entity_1.Project)
], Visitor.prototype, "project", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "visitor_name" }),
    __metadata("design:type", String)
], Visitor.prototype, "visitor_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "company", nullable: true }),
    __metadata("design:type", String)
], Visitor.prototype, "company", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date", name: "visit_date" }),
    __metadata("design:type", String)
], Visitor.prototype, "visit_date", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: VisitorPriority,
        default: VisitorPriority.MEDIUM,
    }),
    __metadata("design:type", String)
], Visitor.prototype, "priority", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], Visitor.prototype, "purpose", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "recorded_by" }),
    __metadata("design:type", String)
], Visitor.prototype, "recorded_by", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: "recorded_by" }),
    __metadata("design:type", user_entity_1.User)
], Visitor.prototype, "recordedByUser", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at" }),
    __metadata("design:type", Date)
], Visitor.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: "updated_at" }),
    __metadata("design:type", Date)
], Visitor.prototype, "updated_at", void 0);
exports.Visitor = Visitor = __decorate([
    (0, typeorm_1.Entity)("visitors")
], Visitor);
//# sourceMappingURL=visitor.entity.js.map