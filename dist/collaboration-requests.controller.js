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
exports.CollaborationRequestsController = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const collaboration_request_entity_1 = require("./entities/collaboration-request.entity");
const projects_service_1 = require("./projects/projects.service");
const jwt_auth_guard_1 = require("./auth/guards/jwt-auth.guard");
const bcrypt = require("bcrypt");
let CollaborationRequestsController = class CollaborationRequestsController {
    constructor(collaborationRequestRepository, projectsService) {
        this.collaborationRequestRepository = collaborationRequestRepository;
        this.projectsService = projectsService;
    }
    async getMyRequests(req) {
        return this.collaborationRequestRepository.find({
            where: [
                {
                    userId: req.user.id,
                    status: collaboration_request_entity_1.CollaborationRequestStatus.PENDING,
                },
                {
                    inviteEmail: req.user.email.toLowerCase(),
                    status: collaboration_request_entity_1.CollaborationRequestStatus.PENDING,
                },
            ],
            relations: ["project", "inviter"],
            order: { createdAt: "DESC" },
        });
    }
    async acceptRequest(id, req, token) {
        const request = await this.collaborationRequestRepository.findOne({
            where: { id },
            relations: ["project"],
        });
        if (!request)
            throw new common_1.NotFoundException("Request not found");
        const isAuthorized = (request.userId && request.userId === req.user.id) ||
            (request.inviteEmail && request.inviteEmail.toLowerCase() === req.user.email.toLowerCase());
        if (!isAuthorized)
            throw new common_1.ForbiddenException();
        if (request.status !== collaboration_request_entity_1.CollaborationRequestStatus.PENDING)
            throw new common_1.ForbiddenException("Request is not pending");
        if (request.expiresAt && new Date() > request.expiresAt) {
            throw new common_1.BadRequestException("This invitation has expired. Please request a new one.");
        }
        if (token && request.tokenHash) {
            const isValidToken = await bcrypt.compare(token, request.tokenHash);
            if (!isValidToken) {
                throw new common_1.ForbiddenException("Invalid invitation token");
            }
        }
        if (request.inviteEmail && !request.userId) {
            request.userId = req.user.id;
            request.inviteEmail = null;
        }
        await this.projectsService.addCollaborator(request.projectId, req.user, request.inviterId);
        request.status = collaboration_request_entity_1.CollaborationRequestStatus.ACCEPTED;
        await this.collaborationRequestRepository.save(request);
        return { message: "Collaboration request accepted" };
    }
    async rejectRequest(id, req) {
        const request = await this.collaborationRequestRepository.findOne({
            where: { id },
        });
        if (!request)
            throw new common_1.NotFoundException("Request not found");
        if (request.userId !== req.user.id)
            throw new common_1.ForbiddenException();
        if (request.status !== collaboration_request_entity_1.CollaborationRequestStatus.PENDING)
            throw new common_1.ForbiddenException("Request is not pending");
        request.status = collaboration_request_entity_1.CollaborationRequestStatus.REJECTED;
        await this.collaborationRequestRepository.save(request);
        return { message: "Collaboration request rejected" };
    }
};
exports.CollaborationRequestsController = CollaborationRequestsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CollaborationRequestsController.prototype, "getMyRequests", null);
__decorate([
    (0, common_1.Post)(":id/accept"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Query)("token")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], CollaborationRequestsController.prototype, "acceptRequest", null);
__decorate([
    (0, common_1.Post)(":id/reject"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CollaborationRequestsController.prototype, "rejectRequest", null);
exports.CollaborationRequestsController = CollaborationRequestsController = __decorate([
    (0, common_1.Controller)("collaboration-requests"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, typeorm_1.InjectRepository)(collaboration_request_entity_1.CollaborationRequest)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        projects_service_1.ProjectsService])
], CollaborationRequestsController);
//# sourceMappingURL=collaboration-requests.controller.js.map