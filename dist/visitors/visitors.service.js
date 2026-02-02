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
exports.VisitorsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const visitor_entity_1 = require("../entities/visitor.entity");
const project_entity_1 = require("../entities/project.entity");
const user_entity_1 = require("../entities/user.entity");
let VisitorsService = class VisitorsService {
    constructor(visitorRepository, projectsRepository) {
        this.visitorRepository = visitorRepository;
        this.projectsRepository = projectsRepository;
    }
    hasProjectAccess(project, userId) {
        return (project.owner_id === userId ||
            (project.collaborators || []).some((c) => c.id === userId) ||
            false);
    }
    isConsultant(user) {
        return user.role?.toLowerCase() === user_entity_1.UserRole.CONSULTANT.toLowerCase();
    }
    isContractorOrSubContractor(user) {
        const r = user.role?.toLowerCase();
        return r === user_entity_1.UserRole.CONTRACTOR.toLowerCase() || r === user_entity_1.UserRole.SUB_CONTRACTOR.toLowerCase();
    }
    canAddVisitor(user) {
        return this.isContractorOrSubContractor(user);
    }
    async create(projectId, dto, user) {
        if (!this.canAddVisitor(user)) {
            throw new common_1.ForbiddenException("Only contractors and sub-contractors can record site visitors");
        }
        const project = await this.projectsRepository.findOne({
            where: { id: projectId },
            relations: ["collaborators"],
        });
        if (!project) {
            throw new common_1.NotFoundException("Project not found");
        }
        if (!this.hasProjectAccess(project, user.id)) {
            throw new common_1.ForbiddenException("You do not have access to this project");
        }
        const dateStr = dto.visit_date.split("T")[0];
        const entity = this.visitorRepository.create({
            project_id: projectId,
            recorded_by: user.id,
            visitor_name: dto.visitor_name,
            company: dto.company ?? null,
            visit_date: dateStr,
            priority: dto.priority ?? visitor_entity_1.VisitorPriority.MEDIUM,
            purpose: dto.purpose ?? null,
        });
        return this.visitorRepository.save(entity);
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
        return this.visitorRepository.find({
            where: { project_id: projectId },
            relations: ["recordedByUser"],
            order: { visit_date: "DESC", created_at: "DESC" },
        });
    }
    async findOne(id, user) {
        const visitor = await this.visitorRepository.findOne({
            where: { id },
            relations: ["project", "recordedByUser", "project.collaborators"],
        });
        if (!visitor) {
            throw new common_1.NotFoundException("Visitor record not found");
        }
        const project = visitor.project;
        if (!this.isConsultant(user) && !this.hasProjectAccess(project, user.id)) {
            throw new common_1.ForbiddenException("You do not have access to this visitor record");
        }
        return visitor;
    }
    async update(id, dto, user) {
        if (!this.canAddVisitor(user)) {
            throw new common_1.ForbiddenException("Only contractors and sub-contractors can edit site visitors");
        }
        const visitor = await this.findOne(id, user);
        if (dto.visit_date)
            visitor.visit_date = dto.visit_date.split("T")[0];
        if (dto.visitor_name !== undefined)
            visitor.visitor_name = dto.visitor_name;
        if (dto.company !== undefined)
            visitor.company = dto.company ?? null;
        if (dto.priority !== undefined)
            visitor.priority = dto.priority;
        if (dto.purpose !== undefined)
            visitor.purpose = dto.purpose ?? null;
        return this.visitorRepository.save(visitor);
    }
    async remove(id, user) {
        if (!this.canAddVisitor(user)) {
            throw new common_1.ForbiddenException("Only contractors and sub-contractors can remove site visitors");
        }
        const visitor = await this.findOne(id, user);
        await this.visitorRepository.remove(visitor);
    }
};
exports.VisitorsService = VisitorsService;
exports.VisitorsService = VisitorsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(visitor_entity_1.Visitor)),
    __param(1, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], VisitorsService);
//# sourceMappingURL=visitors.service.js.map