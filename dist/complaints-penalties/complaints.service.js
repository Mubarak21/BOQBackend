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
exports.ComplaintsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const complaint_entity_1 = require("../entities/complaint.entity");
const user_entity_1 = require("../entities/user.entity");
const project_entity_1 = require("../entities/project.entity");
let ComplaintsService = class ComplaintsService {
    constructor(complaintsRepository, projectsRepository) {
        this.complaintsRepository = complaintsRepository;
        this.projectsRepository = projectsRepository;
    }
    async create(createComplaintDto, user) {
        const allowedRoles = [user_entity_1.UserRole.CONSULTANT, user_entity_1.UserRole.CONTRACTOR, user_entity_1.UserRole.SUB_CONTRACTOR];
        if (!allowedRoles.includes(user.role)) {
            throw new common_1.ForbiddenException("Only consultants, contractors, and sub-contractors can raise complaints");
        }
        const project = await this.projectsRepository.findOne({
            where: { id: createComplaintDto.project_id },
        });
        if (!project) {
            throw new common_1.NotFoundException("Project not found");
        }
        const complaint = this.complaintsRepository.create({
            ...createComplaintDto,
            raised_by: user.id,
            status: complaint_entity_1.ComplaintStatus.OPEN,
        });
        return this.complaintsRepository.save(complaint);
    }
    async findByProject(projectId) {
        const complaints = await this.complaintsRepository.find({
            where: { project_id: projectId },
            relations: ["raiser", "responder", "phase", "subPhase"],
            order: { created_at: "DESC" },
        });
        return complaints.map(complaint => ({
            id: complaint.id,
            projectId: complaint.project_id,
            phaseId: complaint.phase_id,
            subPhaseId: complaint.sub_phase_id,
            raisedBy: complaint.raised_by,
            raisedByName: complaint.raiser?.display_name || null,
            title: complaint.title,
            description: complaint.description,
            status: complaint.status,
            createdAt: complaint.created_at,
            response: complaint.response,
            appealReason: complaint.appeal_reason,
        }));
    }
    async findOne(id) {
        const complaint = await this.complaintsRepository.findOne({
            where: { id },
            relations: ["raiser", "responder", "phase", "subPhase", "project"],
        });
        if (!complaint) {
            throw new common_1.NotFoundException(`Complaint with ID ${id} not found`);
        }
        return complaint;
    }
    async respond(id, respondDto, user) {
        const complaint = await this.findOne(id);
        if (user.role !== user_entity_1.UserRole.CONTRACTOR && user.role !== user_entity_1.UserRole.SUB_CONTRACTOR) {
            throw new common_1.ForbiddenException("Only contractors and sub_contractors can respond to complaints");
        }
        if (complaint.status === complaint_entity_1.ComplaintStatus.RESOLVED) {
            throw new common_1.BadRequestException("Complaint is already resolved");
        }
        complaint.response = respondDto.response;
        complaint.responded_by = user.id;
        complaint.responded_at = new Date();
        complaint.status = complaint_entity_1.ComplaintStatus.RESOLVED;
        return this.complaintsRepository.save(complaint);
    }
    async appeal(id, appealDto, user) {
        const complaint = await this.findOne(id);
        if (user.role !== user_entity_1.UserRole.CONTRACTOR && user.role !== user_entity_1.UserRole.SUB_CONTRACTOR) {
            throw new common_1.ForbiddenException("Only contractors and sub_contractors can appeal complaints");
        }
        if (complaint.status === complaint_entity_1.ComplaintStatus.APPEALED) {
            throw new common_1.BadRequestException("Complaint is already appealed");
        }
        complaint.appeal_reason = appealDto.reason;
        complaint.appealed_at = new Date();
        complaint.status = complaint_entity_1.ComplaintStatus.APPEALED;
        return this.complaintsRepository.save(complaint);
    }
};
exports.ComplaintsService = ComplaintsService;
exports.ComplaintsService = ComplaintsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(complaint_entity_1.Complaint)),
    __param(1, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], ComplaintsService);
//# sourceMappingURL=complaints.service.js.map