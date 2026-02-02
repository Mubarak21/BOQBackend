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
exports.EquipmentService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const equipment_entity_1 = require("../entities/equipment.entity");
const project_entity_1 = require("../entities/project.entity");
const user_entity_1 = require("../entities/user.entity");
let EquipmentService = class EquipmentService {
    constructor(equipmentRepository, projectsRepository) {
        this.equipmentRepository = equipmentRepository;
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
    async getProjectsWithEquipmentCount(user) {
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
        const counts = await this.equipmentRepository
            .createQueryBuilder("e")
            .select("e.project_id", "project_id")
            .addSelect("COUNT(e.id)", "count")
            .groupBy("e.project_id")
            .getRawMany();
        const countMap = new Map(counts.map((r) => [r.project_id, parseInt(r.count, 10)]));
        return projects.map((p) => ({
            id: p.id,
            title: p.title || "Untitled Project",
            equipmentCount: countMap.get(p.id) || 0,
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
        return this.equipmentRepository.find({
            where: { project_id: projectId },
            order: { name: "ASC", created_at: "DESC" },
        });
    }
    async create(projectId, dto, user) {
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
        const entity = this.equipmentRepository.create({
            project_id: projectId,
            name: dto.name,
            description: dto.description ?? null,
            quantity: dto.quantity ?? 1,
            category: dto.category ?? equipment_entity_1.EquipmentCategory.OTHER,
            status: dto.status ?? equipment_entity_1.EquipmentStatus.AVAILABLE,
            serial_number: dto.serial_number ?? null,
        });
        return this.equipmentRepository.save(entity);
    }
    async findOne(id, user) {
        const equipment = await this.equipmentRepository.findOne({
            where: { id },
            relations: ["project", "project.collaborators"],
        });
        if (!equipment) {
            throw new common_1.NotFoundException("Equipment not found");
        }
        const project = equipment.project;
        if (!this.isConsultant(user) && !this.hasProjectAccess(project, user.id)) {
            throw new common_1.ForbiddenException("You do not have access to this equipment");
        }
        return equipment;
    }
    async update(id, dto, user) {
        const equipment = await this.findOne(id, user);
        if (dto.name !== undefined)
            equipment.name = dto.name;
        if (dto.description !== undefined)
            equipment.description = dto.description;
        if (dto.quantity !== undefined)
            equipment.quantity = dto.quantity;
        if (dto.category !== undefined)
            equipment.category = dto.category;
        if (dto.status !== undefined)
            equipment.status = dto.status;
        if (dto.serial_number !== undefined)
            equipment.serial_number = dto.serial_number;
        return this.equipmentRepository.save(equipment);
    }
    async remove(id, user) {
        const equipment = await this.findOne(id, user);
        await this.equipmentRepository.remove(equipment);
    }
};
exports.EquipmentService = EquipmentService;
exports.EquipmentService = EquipmentService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(equipment_entity_1.Equipment)),
    __param(1, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], EquipmentService);
//# sourceMappingURL=equipment.service.js.map