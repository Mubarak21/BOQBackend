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
exports.ProjectMetadata = void 0;
const typeorm_1 = require("typeorm");
const project_entity_1 = require("./project.entity");
let ProjectMetadata = class ProjectMetadata {
};
exports.ProjectMetadata = ProjectMetadata;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], ProjectMetadata.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], ProjectMetadata.prototype, "project_id", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => project_entity_1.Project, (project) => project.metadata, {
        onDelete: "CASCADE",
    }),
    (0, typeorm_1.JoinColumn)({ name: "project_id" }),
    __metadata("design:type", project_entity_1.Project)
], ProjectMetadata.prototype, "project", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], ProjectMetadata.prototype, "location", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], ProjectMetadata.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], ProjectMetadata.prototype, "coordinates", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], ProjectMetadata.prototype, "client_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], ProjectMetadata.prototype, "client_contact", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], ProjectMetadata.prototype, "client_email", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], ProjectMetadata.prototype, "architect", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], ProjectMetadata.prototype, "engineer", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], ProjectMetadata.prototype, "contractor_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], ProjectMetadata.prototype, "contract_number", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date", nullable: true }),
    __metadata("design:type", Date)
], ProjectMetadata.prototype, "contract_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], ProjectMetadata.prototype, "permit_number", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date", nullable: true }),
    __metadata("design:type", Date)
], ProjectMetadata.prototype, "permit_issued_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], ProjectMetadata.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "jsonb", nullable: true }),
    __metadata("design:type", Object)
], ProjectMetadata.prototype, "custom_fields", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at" }),
    __metadata("design:type", Date)
], ProjectMetadata.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: "updated_at" }),
    __metadata("design:type", Date)
], ProjectMetadata.prototype, "updatedAt", void 0);
exports.ProjectMetadata = ProjectMetadata = __decorate([
    (0, typeorm_1.Entity)("project_metadata")
], ProjectMetadata);
//# sourceMappingURL=project-metadata.entity.js.map