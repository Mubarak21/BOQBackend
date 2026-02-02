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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const path = require("path");
const fs = require("fs");
const fs_1 = require("fs");
const project_document_entity_1 = require("../entities/project-document.entity");
const project_entity_1 = require("../entities/project.entity");
const user_entity_1 = require("../entities/user.entity");
let DocumentsService = class DocumentsService {
    constructor(documentRepository, projectsRepository) {
        this.documentRepository = documentRepository;
        this.projectsRepository = projectsRepository;
        this.uploadsDir = path.join(process.cwd(), "uploads", "documents");
    }
    hasProjectAccess(project, userId) {
        return (project.owner_id === userId ||
            (project.collaborators || []).some((c) => c.id === userId) ||
            false);
    }
    isConsultant(user) {
        return user.role?.toLowerCase() === user_entity_1.UserRole.CONSULTANT.toLowerCase();
    }
    async getProjectsWithDocumentCount(user) {
        let projects;
        if (this.isConsultant(user)) {
            projects = await this.projectsRepository.find({
                relations: ["collaborators"],
                order: { updated_at: "DESC" },
            });
        }
        else {
            projects = await this.projectsRepository
                .createQueryBuilder("p")
                .leftJoinAndSelect("p.collaborators", "c")
                .where("p.owner_id = :userId", { userId: user.id })
                .orWhere("c.id = :userId", { userId: user.id })
                .orderBy("p.updated_at", "DESC")
                .getMany();
        }
        const counts = await this.documentRepository
            .createQueryBuilder("d")
            .select("d.project_id", "project_id")
            .addSelect("COUNT(d.id)", "count")
            .groupBy("d.project_id")
            .getRawMany();
        const countMap = new Map(counts.map((r) => [r.project_id, parseInt(r.count, 10)]));
        return projects.map((p) => ({
            id: p.id,
            title: p.title || "Untitled Project",
            documentCount: countMap.get(p.id) || 0,
        }));
    }
    async findByProject(projectId, user) {
        const project = await this.projectsRepository.findOne({
            where: { id: projectId },
            relations: ["collaborators"],
        });
        if (!project) {
            throw new common_1.NotFoundException("Project not found");
        }
        if (!this.isConsultant(user) && !this.hasProjectAccess(project, user.id)) {
            throw new common_1.ForbiddenException("You do not have access to this project");
        }
        return this.documentRepository.find({
            where: { project_id: projectId },
            relations: ["uploadedByUser"],
            order: { created_at: "DESC" },
        });
    }
    async create(projectId, user, file, displayName, description, category) {
        const project = await this.projectsRepository.findOne({
            where: { id: projectId },
            relations: ["collaborators"],
        });
        if (!project) {
            throw new common_1.NotFoundException("Project not found");
        }
        if (!this.isConsultant(user) && !this.hasProjectAccess(project, user.id)) {
            throw new common_1.ForbiddenException("You do not have access to this project");
        }
        const projectDir = path.join(this.uploadsDir, projectId);
        if (!fs.existsSync(projectDir)) {
            fs.mkdirSync(projectDir, { recursive: true });
        }
        const safeName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const filePath = path.join(projectDir, safeName);
        fs.writeFileSync(filePath, file.buffer);
        const relativePath = path.join("documents", projectId, safeName).replace(/\\/g, "/");
        const doc = this.documentRepository.create({
            project_id: projectId,
            file_name: file.originalname,
            display_name: displayName ?? null,
            description: description ?? null,
            file_path: "/uploads/" + relativePath,
            mime_type: file.mimetype ?? null,
            category: category ?? project_document_entity_1.DocumentCategory.OTHER,
            uploaded_by: user.id,
        });
        return this.documentRepository.save(doc);
    }
    async findOne(id, user) {
        const doc = await this.documentRepository.findOne({
            where: { id },
            relations: ["project", "project.collaborators", "uploadedByUser"],
        });
        if (!doc) {
            throw new common_1.NotFoundException("Document not found");
        }
        const project = doc.project;
        if (!this.isConsultant(user) && !this.hasProjectAccess(project, user.id)) {
            throw new common_1.ForbiddenException("You do not have access to this document");
        }
        return doc;
    }
    async remove(id, user) {
        const doc = await this.findOne(id, user);
        const fullPath = path.join(process.cwd(), doc.file_path.replace(/^\//, "").replace(/\//g, path.sep));
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }
        await this.documentRepository.remove(doc);
    }
    async getFileStream(id, user) {
        const doc = await this.findOne(id, user);
        const fullPath = path.join(process.cwd(), doc.file_path.replace(/^\//, "").replace(/\//g, path.sep));
        if (!fs.existsSync(fullPath)) {
            throw new common_1.NotFoundException("File not found on server");
        }
        const fileName = doc.display_name || doc.file_name;
        const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
        return {
            stream: (0, fs_1.createReadStream)(fullPath),
            fileName: safeFileName,
            mimeType: doc.mime_type,
        };
    }
};
exports.DocumentsService = DocumentsService;
exports.DocumentsService = DocumentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(project_document_entity_1.ProjectDocument)),
    __param(1, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], DocumentsService);
//# sourceMappingURL=documents.service.js.map