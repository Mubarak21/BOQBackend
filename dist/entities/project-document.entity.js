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
exports.ProjectDocument = exports.DocumentCategory = void 0;
const typeorm_1 = require("typeorm");
const project_entity_1 = require("./project.entity");
const user_entity_1 = require("./user.entity");
var DocumentCategory;
(function (DocumentCategory) {
    DocumentCategory["CONTRACT"] = "contract";
    DocumentCategory["PERMIT"] = "permit";
    DocumentCategory["DRAWING"] = "drawing";
    DocumentCategory["REPORT"] = "report";
    DocumentCategory["SPECIFICATION"] = "specification";
    DocumentCategory["OTHER"] = "other";
})(DocumentCategory || (exports.DocumentCategory = DocumentCategory = {}));
let ProjectDocument = class ProjectDocument {
};
exports.ProjectDocument = ProjectDocument;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], ProjectDocument.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "project_id" }),
    __metadata("design:type", String)
], ProjectDocument.prototype, "project_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => project_entity_1.Project, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "project_id" }),
    __metadata("design:type", project_entity_1.Project)
], ProjectDocument.prototype, "project", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255, name: "file_name" }),
    __metadata("design:type", String)
], ProjectDocument.prototype, "file_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 500, name: "display_name", nullable: true }),
    __metadata("design:type", String)
], ProjectDocument.prototype, "display_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], ProjectDocument.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 500, name: "file_path" }),
    __metadata("design:type", String)
], ProjectDocument.prototype, "file_path", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255, name: "mime_type", nullable: true }),
    __metadata("design:type", String)
], ProjectDocument.prototype, "mime_type", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: DocumentCategory,
        default: DocumentCategory.OTHER,
    }),
    __metadata("design:type", String)
], ProjectDocument.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "uploaded_by" }),
    __metadata("design:type", String)
], ProjectDocument.prototype, "uploaded_by", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: "uploaded_by" }),
    __metadata("design:type", user_entity_1.User)
], ProjectDocument.prototype, "uploadedByUser", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at" }),
    __metadata("design:type", Date)
], ProjectDocument.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: "updated_at" }),
    __metadata("design:type", Date)
], ProjectDocument.prototype, "updated_at", void 0);
exports.ProjectDocument = ProjectDocument = __decorate([
    (0, typeorm_1.Entity)("project_documents")
], ProjectDocument);
//# sourceMappingURL=project-document.entity.js.map