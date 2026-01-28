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
exports.ProjectSettings = void 0;
const typeorm_1 = require("typeorm");
const project_entity_1 = require("./project.entity");
let ProjectSettings = class ProjectSettings {
};
exports.ProjectSettings = ProjectSettings;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], ProjectSettings.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], ProjectSettings.prototype, "project_id", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => project_entity_1.Project, (project) => project.settings, {
        onDelete: "CASCADE",
    }),
    (0, typeorm_1.JoinColumn)({ name: "project_id" }),
    __metadata("design:type", project_entity_1.Project)
], ProjectSettings.prototype, "project", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: true }),
    __metadata("design:type", Boolean)
], ProjectSettings.prototype, "allow_collaborator_invites", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: true }),
    __metadata("design:type", Boolean)
], ProjectSettings.prototype, "allow_task_creation", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: true }),
    __metadata("design:type", Boolean)
], ProjectSettings.prototype, "allow_phase_modification", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], ProjectSettings.prototype, "require_approval_for_transactions", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "decimal", precision: 15, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], ProjectSettings.prototype, "approval_threshold", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: true }),
    __metadata("design:type", Boolean)
], ProjectSettings.prototype, "send_notifications", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: true }),
    __metadata("design:type", Boolean)
], ProjectSettings.prototype, "track_inventory", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: true }),
    __metadata("design:type", Boolean)
], ProjectSettings.prototype, "track_time", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 50, default: "USD" }),
    __metadata("design:type", String)
], ProjectSettings.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 50, default: "en" }),
    __metadata("design:type", String)
], ProjectSettings.prototype, "language", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "jsonb", nullable: true }),
    __metadata("design:type", Object)
], ProjectSettings.prototype, "custom_settings", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "jsonb", nullable: true }),
    __metadata("design:type", Object)
], ProjectSettings.prototype, "notification_rules", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at" }),
    __metadata("design:type", Date)
], ProjectSettings.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: "updated_at" }),
    __metadata("design:type", Date)
], ProjectSettings.prototype, "updatedAt", void 0);
exports.ProjectSettings = ProjectSettings = __decorate([
    (0, typeorm_1.Entity)("project_settings")
], ProjectSettings);
//# sourceMappingURL=project-settings.entity.js.map