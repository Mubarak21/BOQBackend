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
exports.AccidentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const accident_entity_1 = require("../entities/accident.entity");
const project_entity_1 = require("../entities/project.entity");
const user_entity_1 = require("../entities/user.entity");
let AccidentsService = class AccidentsService {
    constructor(accidentRepository, projectsRepository) {
        this.accidentRepository = accidentRepository;
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
    async create(projectId, dto, user) {
        if (!this.isContractorOrSubContractor(user)) {
            throw new common_1.ForbiddenException("Only contractors and sub-contractors can report accidents");
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
        const dateStr = dto.accident_date.split("T")[0];
        const entity = this.accidentRepository.create({
            project_id: projectId,
            reported_by: user.id,
            accident_date: dateStr,
            description: dto.description,
            severity: dto.severity,
            location: dto.location ?? null,
            injured_count: dto.injured_count ?? 0,
            action_taken: dto.action_taken ?? null,
            status: accident_entity_1.AccidentStatus.REPORTED,
        });
        return this.accidentRepository.save(entity);
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
        return this.accidentRepository.find({
            where: { project_id: projectId },
            relations: ["reportedByUser"],
            order: { accident_date: "DESC", created_at: "DESC" },
        });
    }
    async findOne(id, user) {
        const accident = await this.accidentRepository.findOne({
            where: { id },
            relations: ["project", "reportedByUser", "project.collaborators"],
        });
        if (!accident) {
            throw new common_1.NotFoundException("Accident report not found");
        }
        const project = accident.project;
        if (!this.isConsultant(user) && !this.hasProjectAccess(project, user.id)) {
            throw new common_1.ForbiddenException("You do not have access to this accident report");
        }
        return accident;
    }
    async update(id, dto, user) {
        const accident = await this.findOne(id, user);
        if (dto.status !== undefined) {
            accident.status = dto.status;
        }
        if (dto.action_taken !== undefined) {
            accident.action_taken = dto.action_taken;
        }
        return this.accidentRepository.save(accident);
    }
};
exports.AccidentsService = AccidentsService;
exports.AccidentsService = AccidentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(accident_entity_1.Accident)),
    __param(1, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], AccidentsService);
//# sourceMappingURL=accidents.service.js.map