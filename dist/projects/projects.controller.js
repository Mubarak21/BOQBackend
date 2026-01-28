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
exports.ProjectsController = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const platform_express_1 = require("@nestjs/platform-express");
const projects_service_1 = require("./projects.service");
const create_project_dto_1 = require("./dto/create-project.dto");
const update_project_dto_1 = require("./dto/update-project.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const users_service_1 = require("../users/users.service");
const create_phase_dto_1 = require("./dto/create-phase.dto");
const update_phase_dto_1 = require("./dto/update-phase.dto");
const complaints_service_1 = require("../complaints-penalties/complaints.service");
const penalties_service_1 = require("../complaints-penalties/penalties.service");
const evidence_service_1 = require("./evidence.service");
const boq_parser_service_1 = require("./boq-parser.service");
const boq_progress_gateway_1 = require("./boq-progress.gateway");
const file_validation_pipe_1 = require("./pipes/file-validation.pipe");
const collaboration_request_entity_1 = require("../entities/collaboration-request.entity");
const email_service_1 = require("./email.service");
const rate_limit_guard_1 = require("../auth/guards/rate-limit.guard");
const project_boq_service_1 = require("./services/project-boq.service");
let ProjectsController = class ProjectsController {
    constructor(projectsService, usersService, complaintsService, penaltiesService, evidenceService, boqParserService, boqProgressGateway, emailService, projectBoqService, collaborationRequestRepository) {
        this.projectsService = projectsService;
        this.usersService = usersService;
        this.complaintsService = complaintsService;
        this.penaltiesService = penaltiesService;
        this.evidenceService = evidenceService;
        this.boqParserService = boqParserService;
        this.boqProgressGateway = boqProgressGateway;
        this.emailService = emailService;
        this.projectBoqService = projectBoqService;
        this.collaborationRequestRepository = collaborationRequestRepository;
    }
    create(createProjectDto, req) {
        return this.projectsService.create(createProjectDto, req.user);
    }
    async findAll(req, page = 1, limit = 10, search, status) {
        const isConsultant = req.user.role?.toLowerCase() === 'consultant';
        const isContractor = req.user.role?.toLowerCase() === 'contractor';
        const isSubContractor = req.user.role?.toLowerCase() === 'sub_contractor';
        let result;
        if (isConsultant) {
            result = await this.projectsService.findAllPaginated({
                page,
                limit,
                search,
                status,
            });
        }
        else {
            result = await this.projectsService.findUserProjectsPaginated(req.user.id, {
                page,
                limit,
                search,
                status,
            });
        }
        const items = await Promise.all(result.items.map((p) => this.projectsService.getProjectResponse(p, req.user.id)));
        return {
            items,
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages,
        };
    }
    async getAvailableAssignees(req) {
        const projectId = req.query.projectId;
        if (!projectId) {
            throw new common_1.BadRequestException("projectId query parameter is required");
        }
        return this.projectsService.getAvailableAssignees(projectId);
    }
    async findOne(id, req) {
        const project = await this.projectsService.findOne(id, req.user.id);
        return await this.projectsService.getProjectResponse(project);
    }
    update(id, updateProjectDto, req) {
        return this.projectsService.update(id, updateProjectDto, req.user.id);
    }
    remove(id, req) {
        return this.projectsService.remove(id, req.user.id);
    }
    async inviteCollaborator(id, body, req) {
        const project = await this.projectsService.findOne(id, req.user.id);
        const user = await this.usersService.findOne(req.user.id);
        const isConsultant = user?.role === "consultant";
        if (project.owner_id !== req.user.id && !isConsultant) {
            throw new common_1.BadRequestException("Only the project owner or consultant can invite collaborators");
        }
        if (!body.userId && !body.email) {
            throw new common_1.BadRequestException("Either userId or email must be provided");
        }
        let collaboratorUser = null;
        let userId = null;
        if (body.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(body.email)) {
                throw new common_1.BadRequestException("Invalid email format");
            }
            const inviteEmail = body.email.toLowerCase().trim();
            const existingUser = await this.usersService.findByEmail(inviteEmail);
            if (!existingUser) {
                throw new common_1.BadRequestException("User with this email does not exist. They must register first.");
            }
            userId = existingUser.id;
            collaboratorUser = existingUser;
        }
        else if (body.userId) {
            userId = body.userId;
            collaboratorUser = await this.usersService.findOne(userId);
            if (!collaboratorUser) {
                throw new common_1.BadRequestException("User not found");
            }
        }
        if (project.collaborators?.some((c) => c.id === userId)) {
            throw new common_1.BadRequestException("User is already a collaborator");
        }
        if (project.owner_id === userId) {
            throw new common_1.BadRequestException("Owner cannot be added as collaborator");
        }
        await this.projectsService.addCollaborator(id, collaboratorUser, req.user.id);
        return { message: "Collaborator added successfully" };
    }
    async addCollaborator(id, userId, req) {
        const collaborator = await this.usersService.findOne(userId);
        return this.projectsService.addCollaborator(id, collaborator, req.user.id);
    }
    removeCollaborator(id, userId, req) {
        return this.projectsService.removeCollaborator(id, userId, req.user.id);
    }
    async previewBoq(file, req, roomId) {
        const parseResult = await this.boqParserService.parseBoqFile(file, roomId
            ? (progress) => {
                this.boqProgressGateway.emitProgress(roomId, progress);
            }
            : undefined);
        return {
            items: parseResult.items,
            totalAmount: parseResult.totalAmount,
            sections: parseResult.sections,
            uncertainHeaders: parseResult.uncertainHeaders,
            metadata: parseResult.metadata,
            gridData: parseResult.items.map((item) => ({
                id: item.id,
                description: item.description,
                quantity: item.quantity,
                unit: item.unit,
                rate: item.rate,
                amount: item.amount,
                section: item.section || "",
                subSection: item.subSection || "",
                rowIndex: item.rowIndex,
            })),
        };
    }
    async uploadBoq(id, file, req, roomId, type) {
        const parseResult = await this.boqParserService.parseBoqFile(file, roomId
            ? (progress) => {
                this.boqProgressGateway.emitProgress(roomId, progress);
            }
            : undefined);
        const processedData = parseResult.items.map((item) => {
            const row = { ...item.rawData };
            const descKey = Object.keys(row).find(key => key.toLowerCase().includes('desc') ||
                key.toLowerCase().includes('description') ||
                key.toLowerCase().includes('item'));
            if (item.description && item.description.trim() !== "") {
                if (descKey) {
                    row[descKey] = item.description;
                }
                else {
                    row['Description'] = item.description;
                }
            }
            return {
                ...row,
                section: item.section,
                subSection: item.subSection,
                _extractedDescription: item.description,
                _extractedUnit: item.unit,
                _extractedQuantity: item.quantity,
                _extractedSection: item.section,
                _extractedAmount: item.amount,
                _extractedRate: item.rate,
                amount: item.amount,
                rate: item.rate,
            };
        });
        return this.projectsService.processBoqFileFromParsedData(id, processedData, parseResult.totalAmount, req.user.id, file, type);
    }
    async getProjectBoqs(id, req) {
        return this.projectsService.getProjectBoqs(id, req.user.id);
    }
    async getMissingBoqItems(id, req, type) {
        return this.projectBoqService.getMissingBoqItems(id, req.user.id, type);
    }
    async createPhase(id, createPhaseDto, req) {
        return this.projectsService.createPhase(id, createPhaseDto, req.user.id);
    }
    async getBoqDraftPhases(id, req) {
        return this.projectsService.getBoqDraftPhases(id, req.user.id);
    }
    async activateBoqPhases(id, body, req) {
        return this.projectsService.activateBoqPhases(id, body.phaseIds, req.user.id, body.linkedContractorPhaseId);
    }
    async getProjectPhases(id, page = 1, limit = 10, req) {
        return this.projectsService.getProjectPhasesPaginated(id, req.user.id, {
            page,
            limit,
        });
    }
    async getContractorPhasesForLinking(id, req) {
        return this.projectsService.getContractorPhasesForLinking(id, req.user.id);
    }
    async updatePhase(projectId, phaseId, updatePhaseDto, req) {
        return this.projectsService.updatePhase(projectId, phaseId, updatePhaseDto, req.user.id);
    }
    async deletePhase(projectId, phaseId, req) {
        await this.projectsService.deletePhase(projectId, phaseId, req.user.id);
        return { message: "Phase deleted successfully" };
    }
    async joinProject(id, req) {
        return this.projectsService.joinProject(id, req.user);
    }
    async createJoinRequest(projectId, req) {
        return this.projectsService.createJoinRequest(projectId, req.user.id);
    }
    async listJoinRequestsForProject(projectId, req) {
        return this.projectsService.listJoinRequestsForProject(projectId, req.user.id);
    }
    async approveJoinRequest(projectId, requestId, req) {
        return this.projectsService.approveJoinRequest(projectId, requestId, req.user.id);
    }
    async denyJoinRequest(projectId, requestId, req) {
        return this.projectsService.denyJoinRequest(projectId, requestId, req.user.id);
    }
    async listMyJoinRequests(req) {
        return this.projectsService.listMyJoinRequests(req.user.id);
    }
    async listJoinRequestsForOwner(req) {
        return this.projectsService.listJoinRequestsForOwner(req.user.id);
    }
    async getAvailablePhaseTasks(id, req) {
        return this.projectsService.getAvailablePhaseTasks(id, req.user.id);
    }
    async getProjectComplaints(id) {
        return this.complaintsService.findByProject(id);
    }
    async getProjectPenalties(id) {
        return this.penaltiesService.findByProject(id);
    }
    async getPhaseEvidence(projectId, phaseId, subPhaseId) {
        if (subPhaseId) {
            return this.evidenceService.findBySubPhase(subPhaseId);
        }
        return this.evidenceService.findByPhase(phaseId);
    }
    async uploadEvidence(projectId, phaseId, file, body, req) {
        return this.evidenceService.uploadEvidence(phaseId, file, body.type, body.notes, body.subPhaseId, req.user);
    }
    async getProjectInventory(id, req, page = 1, limit = 10, category, search) {
        return this.projectsService.getProjectInventory(id, req.user.id, {
            page,
            limit,
            category,
            search,
        });
    }
    async addProjectInventoryItem(id, createInventoryDto, pictureFile, req) {
        return this.projectsService.addProjectInventoryItem(id, createInventoryDto, req.user.id, pictureFile);
    }
    async updateProjectInventoryItem(id, inventoryId, updateData, req) {
        return this.projectsService.updateProjectInventoryItem(id, inventoryId, updateData, req.user.id);
    }
    async deleteProjectInventoryItem(id, inventoryId, req) {
        return this.projectsService.deleteProjectInventoryItem(id, inventoryId, req.user.id);
    }
    async recordInventoryUsage(id, inventoryId, body, req) {
        return this.projectsService.recordInventoryUsage(id, inventoryId, body.quantity, req.user.id, body.phase_id, body.notes);
    }
    async getInventoryUsageHistory(id, inventoryId, page = 1, limit = 10, req) {
        return this.projectsService.getInventoryUsageHistory(id, inventoryId, req.user.id, { page, limit });
    }
    async getProjectInventoryUsage(id, page = 1, limit = 10, req) {
        return this.projectsService.getProjectInventoryUsage(id, req.user.id, { page, limit });
    }
    async linkInventoryToProject(projectId, inventoryId, req) {
        return this.projectsService.linkInventoryToProject(inventoryId, projectId, req.user.id);
    }
    async unlinkInventoryFromProject(projectId, inventoryId, req) {
        return this.projectsService.unlinkInventoryFromProject(inventoryId, projectId, req.user.id);
    }
};
exports.ProjectsController = ProjectsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_project_dto_1.CreateProjectDto, Object]),
    __metadata("design:returntype", void 0)
], ProjectsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)("page")),
    __param(2, (0, common_1.Query)("limit")),
    __param(3, (0, common_1.Query)("search")),
    __param(4, (0, common_1.Query)("status")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number, String, String]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)("available-assignees"),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "getAvailableAssignees", null);
__decorate([
    (0, common_1.Get)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_project_dto_1.UpdateProjectDto, Object]),
    __metadata("design:returntype", void 0)
], ProjectsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProjectsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(":id/collaborators/invite"),
    (0, common_1.UseGuards)(rate_limit_guard_1.RateLimitGuard),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "inviteCollaborator", null);
__decorate([
    (0, common_1.Post)(":id/collaborators/:userId"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Param)("userId")),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "addCollaborator", null);
__decorate([
    (0, common_1.Delete)(":id/collaborators/:userId"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Param)("userId")),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], ProjectsController.prototype, "removeCollaborator", null);
__decorate([
    (0, common_1.Post)("boq/preview"),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)("file")),
    __param(0, (0, common_1.UploadedFile)(new file_validation_pipe_1.FileValidationPipe())),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Query)("roomId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "previewBoq", null);
__decorate([
    (0, common_1.Post)(":id/boq"),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)("file")),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.UploadedFile)(new file_validation_pipe_1.FileValidationPipe())),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Query)("roomId")),
    __param(4, (0, common_1.Query)("type")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "uploadBoq", null);
__decorate([
    (0, common_1.Get)(":id/boqs"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "getProjectBoqs", null);
__decorate([
    (0, common_1.Get)(":id/boqs/missing-items"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Query)("type")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "getMissingBoqItems", null);
__decorate([
    (0, common_1.Post)(":id/phases"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_phase_dto_1.CreatePhaseDto, Object]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "createPhase", null);
__decorate([
    (0, common_1.Get)(":id/phases/boq-drafts"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "getBoqDraftPhases", null);
__decorate([
    (0, common_1.Post)(":id/phases/activate-boq"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "activateBoqPhases", null);
__decorate([
    (0, common_1.Get)(":id/phases"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Query)("page")),
    __param(2, (0, common_1.Query)("limit")),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number, Object]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "getProjectPhases", null);
__decorate([
    (0, common_1.Get)(":id/phases/contractor-phases"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "getContractorPhasesForLinking", null);
__decorate([
    (0, common_1.Patch)(":projectId/phases/:phaseId"),
    __param(0, (0, common_1.Param)("projectId")),
    __param(1, (0, common_1.Param)("phaseId")),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_phase_dto_1.UpdatePhaseDto, Object]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "updatePhase", null);
__decorate([
    (0, common_1.Delete)(":projectId/phases/:phaseId"),
    __param(0, (0, common_1.Param)("projectId")),
    __param(1, (0, common_1.Param)("phaseId")),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "deletePhase", null);
__decorate([
    (0, common_1.Post)(":id/join"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "joinProject", null);
__decorate([
    (0, common_1.Post)(":projectId/join-request"),
    __param(0, (0, common_1.Param)("projectId")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "createJoinRequest", null);
__decorate([
    (0, common_1.Get)(":projectId/join-requests"),
    __param(0, (0, common_1.Param)("projectId")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "listJoinRequestsForProject", null);
__decorate([
    (0, common_1.Post)(":projectId/join-requests/:requestId/approve"),
    __param(0, (0, common_1.Param)("projectId")),
    __param(1, (0, common_1.Param)("requestId")),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "approveJoinRequest", null);
__decorate([
    (0, common_1.Post)(":projectId/join-requests/:requestId/deny"),
    __param(0, (0, common_1.Param)("projectId")),
    __param(1, (0, common_1.Param)("requestId")),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "denyJoinRequest", null);
__decorate([
    (0, common_1.Get)("/my/join-requests"),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "listMyJoinRequests", null);
__decorate([
    (0, common_1.Get)("/owner/join-requests"),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "listJoinRequestsForOwner", null);
__decorate([
    (0, common_1.Get)(":id/available-phase-tasks"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "getAvailablePhaseTasks", null);
__decorate([
    (0, common_1.Get)(":id/complaints"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "getProjectComplaints", null);
__decorate([
    (0, common_1.Get)(":id/penalties"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "getProjectPenalties", null);
__decorate([
    (0, common_1.Get)(":id/phases/:phaseId/evidence"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Param)("phaseId")),
    __param(2, (0, common_1.Query)("subPhaseId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "getPhaseEvidence", null);
__decorate([
    (0, common_1.Post)(":id/phases/:phaseId/evidence"),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)("file")),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Param)("phaseId")),
    __param(2, (0, common_1.UploadedFile)()),
    __param(3, (0, common_1.Body)()),
    __param(4, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "uploadEvidence", null);
__decorate([
    (0, common_1.Get)(":id/inventory"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Query)("page")),
    __param(3, (0, common_1.Query)("limit")),
    __param(4, (0, common_1.Query)("category")),
    __param(5, (0, common_1.Query)("search")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Number, Number, String, String]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "getProjectInventory", null);
__decorate([
    (0, common_1.Post)(":id/inventory"),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)("picture", {
        limits: { fileSize: 10 * 1024 * 1024 },
    })),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFile)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "addProjectInventoryItem", null);
__decorate([
    (0, common_1.Patch)(":id/inventory/:inventoryId"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Param)("inventoryId")),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "updateProjectInventoryItem", null);
__decorate([
    (0, common_1.Delete)(":id/inventory/:inventoryId"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Param)("inventoryId")),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "deleteProjectInventoryItem", null);
__decorate([
    (0, common_1.Post)(":id/inventory/:inventoryId/usage"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Param)("inventoryId")),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "recordInventoryUsage", null);
__decorate([
    (0, common_1.Get)(":id/inventory/:inventoryId/usage"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Param)("inventoryId")),
    __param(2, (0, common_1.Query)("page")),
    __param(3, (0, common_1.Query)("limit")),
    __param(4, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, Number, Object]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "getInventoryUsageHistory", null);
__decorate([
    (0, common_1.Get)(":id/inventory/usage"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Query)("page")),
    __param(2, (0, common_1.Query)("limit")),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number, Object]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "getProjectInventoryUsage", null);
__decorate([
    (0, common_1.Post)(":id/inventory/:inventoryId/link"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Param)("inventoryId")),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "linkInventoryToProject", null);
__decorate([
    (0, common_1.Post)(":id/inventory/:inventoryId/unlink"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Param)("inventoryId")),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "unlinkInventoryFromProject", null);
exports.ProjectsController = ProjectsController = __decorate([
    (0, common_1.Controller)("projects"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(9, (0, typeorm_1.InjectRepository)(collaboration_request_entity_1.CollaborationRequest)),
    __metadata("design:paramtypes", [projects_service_1.ProjectsService,
        users_service_1.UsersService,
        complaints_service_1.ComplaintsService,
        penalties_service_1.PenaltiesService,
        evidence_service_1.EvidenceService,
        boq_parser_service_1.BoqParserService,
        boq_progress_gateway_1.BoqProgressGateway,
        email_service_1.EmailService,
        project_boq_service_1.ProjectBoqService,
        typeorm_2.Repository])
], ProjectsController);
//# sourceMappingURL=projects.controller.js.map