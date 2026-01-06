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
exports.PenaltiesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const penalty_entity_1 = require("../entities/penalty.entity");
const user_entity_1 = require("../entities/user.entity");
const project_entity_1 = require("../entities/project.entity");
const complaint_entity_1 = require("../entities/complaint.entity");
let PenaltiesService = class PenaltiesService {
    constructor(penaltiesRepository, projectsRepository, complaintsRepository) {
        this.penaltiesRepository = penaltiesRepository;
        this.projectsRepository = projectsRepository;
        this.complaintsRepository = complaintsRepository;
    }
    async create(createPenaltyDto, user) {
        if (user.role !== user_entity_1.UserRole.CONSULTANT && user.role !== user_entity_1.UserRole.ADMIN) {
            throw new common_1.ForbiddenException("Only consultants and admins can assign penalties");
        }
        const project = await this.projectsRepository.findOne({
            where: { id: createPenaltyDto.project_id },
        });
        if (!project) {
            throw new common_1.NotFoundException("Project not found");
        }
        if (createPenaltyDto.complaint_id) {
            const complaint = await this.complaintsRepository.findOne({
                where: { id: createPenaltyDto.complaint_id },
            });
            if (!complaint) {
                throw new common_1.NotFoundException("Complaint not found");
            }
        }
        const penalty = this.penaltiesRepository.create({
            ...createPenaltyDto,
            assigned_by: user.id,
            status: penalty_entity_1.PenaltyStatus.PENDING,
        });
        return this.penaltiesRepository.save(penalty);
    }
    async findByProject(projectId) {
        const penalties = await this.penaltiesRepository.find({
            where: { project_id: projectId },
            relations: ["assignee", "assigner", "complaint", "phase", "project"],
            order: { created_at: "DESC" },
        });
        return penalties.map(penalty => ({
            id: penalty.id,
            projectId: penalty.project_id,
            phaseId: penalty.phase_id,
            complaintId: penalty.complaint_id,
            amount: Number(penalty.amount),
            reason: penalty.reason,
            status: penalty.status,
            createdAt: penalty.created_at,
            appealReason: penalty.appeal_reason,
        }));
    }
    async findOne(id) {
        const penalty = await this.penaltiesRepository.findOne({
            where: { id },
            relations: ["assignee", "assigner", "complaint", "phase", "project"],
        });
        if (!penalty) {
            throw new common_1.NotFoundException(`Penalty with ID ${id} not found`);
        }
        return penalty;
    }
    async appeal(id, appealDto, user) {
        const penalty = await this.findOne(id);
        if (user.role !== user_entity_1.UserRole.CONTRACTOR && user.role !== user_entity_1.UserRole.SUB_CONTRACTOR) {
            throw new common_1.ForbiddenException("Only contractors and sub_contractors can appeal penalties");
        }
        if (penalty.assigned_to !== user.id) {
            throw new common_1.ForbiddenException("You can only appeal penalties assigned to you");
        }
        if (penalty.status === penalty_entity_1.PenaltyStatus.APPEALED) {
            throw new common_1.BadRequestException("Penalty is already appealed");
        }
        if (penalty.status === penalty_entity_1.PenaltyStatus.PAID) {
            throw new common_1.BadRequestException("Cannot appeal a paid penalty");
        }
        penalty.appeal_reason = appealDto.reason;
        penalty.appealed_at = new Date();
        penalty.status = penalty_entity_1.PenaltyStatus.APPEALED;
        return this.penaltiesRepository.save(penalty);
    }
    async markAsPaid(id, user) {
        const penalty = await this.findOne(id);
        if (user.role !== user_entity_1.UserRole.ADMIN) {
            throw new common_1.ForbiddenException("Only admins can mark penalties as paid");
        }
        penalty.status = penalty_entity_1.PenaltyStatus.PAID;
        penalty.paid_at = new Date();
        return this.penaltiesRepository.save(penalty);
    }
};
exports.PenaltiesService = PenaltiesService;
exports.PenaltiesService = PenaltiesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(penalty_entity_1.Penalty)),
    __param(1, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __param(2, (0, typeorm_1.InjectRepository)(complaint_entity_1.Complaint)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], PenaltiesService);
//# sourceMappingURL=penalties.service.js.map