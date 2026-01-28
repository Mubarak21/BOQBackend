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
exports.ProjectBoq = exports.BOQStatus = exports.BOQType = void 0;
const typeorm_1 = require("typeorm");
const project_entity_1 = require("./project.entity");
const user_entity_1 = require("./user.entity");
var BOQType;
(function (BOQType) {
    BOQType["CONTRACTOR"] = "contractor";
    BOQType["SUB_CONTRACTOR"] = "sub_contractor";
})(BOQType || (exports.BOQType = BOQType = {}));
var BOQStatus;
(function (BOQStatus) {
    BOQStatus["PENDING"] = "pending";
    BOQStatus["PROCESSING"] = "processing";
    BOQStatus["PROCESSED"] = "processed";
    BOQStatus["FAILED"] = "failed";
})(BOQStatus || (exports.BOQStatus = BOQStatus = {}));
let ProjectBoq = class ProjectBoq {
};
exports.ProjectBoq = ProjectBoq;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], ProjectBoq.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ProjectBoq.prototype, "project_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => project_entity_1.Project, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "project_id" }),
    __metadata("design:type", project_entity_1.Project)
], ProjectBoq.prototype, "project", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: BOQType,
    }),
    __metadata("design:type", String)
], ProjectBoq.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: BOQStatus,
        default: BOQStatus.PENDING,
    }),
    __metadata("design:type", String)
], ProjectBoq.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ProjectBoq.prototype, "file_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ProjectBoq.prototype, "file_path", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ProjectBoq.prototype, "file_mimetype", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "bigint", nullable: true }),
    __metadata("design:type", Number)
], ProjectBoq.prototype, "file_size", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "decimal",
        precision: 20,
        scale: 2,
        nullable: true,
    }),
    __metadata("design:type", Number)
], ProjectBoq.prototype, "total_amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", nullable: true }),
    __metadata("design:type", Number)
], ProjectBoq.prototype, "phases_count", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ProjectBoq.prototype, "uploaded_by", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: "uploaded_by" }),
    __metadata("design:type", user_entity_1.User)
], ProjectBoq.prototype, "uploader", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], ProjectBoq.prototype, "error_message", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ProjectBoq.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], ProjectBoq.prototype, "updated_at", void 0);
exports.ProjectBoq = ProjectBoq = __decorate([
    (0, typeorm_1.Entity)("project_boqs")
], ProjectBoq);
//# sourceMappingURL=project-boq.entity.js.map