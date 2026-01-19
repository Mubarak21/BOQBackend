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
exports.ProjectCollaborationService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const project_entity_1 = require("../../entities/project.entity");
const project_access_request_entity_1 = require("../../entities/project-access-request.entity");
const users_service_1 = require("../../users/users.service");
const activities_service_1 = require("../../activities/activities.service");
const projects_service_1 = require("../projects.service");
let ProjectCollaborationService = class ProjectCollaborationService {
    constructor(projectsRepository, accessRequestRepository, usersService, activitiesService, projectsService) {
        this.projectsRepository = projectsRepository;
        this.accessRequestRepository = accessRequestRepository;
        this.usersService = usersService;
        this.activitiesService = activitiesService;
        this.projectsService = projectsService;
    }
    async addCollaborator(projectId, collaborator, userId) {
        const project = await this.projectsService.findOne(projectId);
        const user = await this.usersService.findOne(userId);
        const isAdmin = user?.role === "admin";
        const isConsultant = user?.role === "consultant";
        if (project.owner_id !== userId && !isAdmin && !isConsultant) {
            throw new common_1.ForbiddenException("Only the project owner, admin, or consultant can add collaborators");
        }
        if (!project.collaborators) {
            project.collaborators = [];
        }
        if (project.collaborators.some((c) => c.id === collaborator.id)) {
            throw new common_1.BadRequestException("User is already a collaborator");
        }
        if (project.owner_id === collaborator.id) {
            throw new common_1.BadRequestException("Owner cannot be added as collaborator");
        }
        project.collaborators.push(collaborator);
        return this.projectsRepository.save(project);
    }
    async removeCollaborator(projectId, collaboratorId, userId) {
        const project = await this.projectsService.findOne(projectId);
        const user = await this.usersService.findOne(userId);
        const isAdmin = user?.role === "admin";
        const isConsultant = user?.role === "consultant";
        if (project.owner_id !== userId && !isAdmin && !isConsultant) {
            throw new common_1.ForbiddenException("Only the project owner, admin, or consultant can remove collaborators");
        }
        const initialLength = project.collaborators?.length || 0;
        project.collaborators =
            project.collaborators?.filter((c) => c.id !== collaboratorId) || [];
        if (project.collaborators.length === initialLength) {
            throw new common_1.NotFoundException("Collaborator not found in project");
        }
        return this.projectsRepository.save(project);
    }
    async createJoinRequest(projectId, requesterId) {
        const existing = await this.accessRequestRepository.findOne({
            where: {
                project_id: projectId,
                requester_id: requesterId,
                status: "pending",
            },
        });
        if (existing)
            throw new common_1.BadRequestException("A pending join request already exists.");
        const request = this.accessRequestRepository.create({
            project_id: projectId,
            requester_id: requesterId,
            status: "pending",
        });
        const savedRequest = await this.accessRequestRepository.save(request);
        return savedRequest;
    }
    async listJoinRequestsForProject(projectId, ownerId) {
        const project = await this.projectsRepository.findOne({
            where: { id: projectId },
        });
        if (!project)
            throw new common_1.NotFoundException("Project not found");
        const user = await this.usersService.findOne(ownerId);
        const isAdmin = user?.role === "admin";
        const isConsultant = user?.role === "consultant";
        if (project.owner_id !== ownerId && !isAdmin && !isConsultant)
            throw new common_1.ForbiddenException("Only the owner, admin, or consultant can view join requests");
        return this.accessRequestRepository.find({
            where: { project_id: projectId },
            order: { created_at: "DESC" },
        });
    }
    async approveJoinRequest(projectId, requestId, ownerId) {
        const project = await this.projectsRepository.findOne({
            where: { id: projectId },
            relations: ["collaborators"],
        });
        if (!project)
            throw new common_1.NotFoundException("Project not found");
        const user = await this.usersService.findOne(ownerId);
        const isAdmin = user?.role === "admin";
        const isConsultant = user?.role === "consultant";
        if (project.owner_id !== ownerId && !isAdmin && !isConsultant)
            throw new common_1.ForbiddenException("Only the owner, admin, or consultant can approve join requests");
        const request = await this.accessRequestRepository.findOne({
            where: { id: requestId, project_id: projectId },
        });
        if (!request)
            throw new common_1.NotFoundException("Join request not found");
        if (request.status !== "pending")
            throw new common_1.BadRequestException("Request is not pending");
        const requesterUser = await this.usersService.findOne(request.requester_id);
        if (!project.collaborators.some((c) => c.id === requesterUser.id)) {
            project.collaborators.push(requesterUser);
            await this.projectsRepository.save(project);
        }
        request.status = "approved";
        request.reviewed_at = new Date();
        return this.accessRequestRepository.save(request);
    }
    async denyJoinRequest(projectId, requestId, ownerId) {
        const project = await this.projectsRepository.findOne({
            where: { id: projectId },
        });
        if (!project)
            throw new common_1.NotFoundException("Project not found");
        const user = await this.usersService.findOne(ownerId);
        const isAdmin = user?.role === "admin";
        const isConsultant = user?.role === "consultant";
        if (project.owner_id !== ownerId && !isAdmin && !isConsultant)
            throw new common_1.ForbiddenException("Only the owner, admin, or consultant can deny join requests");
        const request = await this.accessRequestRepository.findOne({
            where: { id: requestId, project_id: projectId },
        });
        if (!request)
            throw new common_1.NotFoundException("Join request not found");
        if (request.status !== "pending")
            throw new common_1.BadRequestException("Request is not pending");
        request.status = "denied";
        request.reviewed_at = new Date();
        return this.accessRequestRepository.save(request);
    }
    async listMyJoinRequests(userId) {
        return this.accessRequestRepository.find({
            where: { requester_id: userId },
            order: { created_at: "DESC" },
        });
    }
    async listJoinRequestsForOwner(ownerId) {
        const projects = await this.projectsRepository.find({
            where: { owner_id: ownerId },
        });
        const projectIds = projects.map((p) => p.id);
        if (projectIds.length === 0)
            return [];
        return this.accessRequestRepository.find({
            where: { project_id: (0, typeorm_2.In)(projectIds) },
            order: { created_at: "DESC" },
        });
    }
};
exports.ProjectCollaborationService = ProjectCollaborationService;
exports.ProjectCollaborationService = ProjectCollaborationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __param(1, (0, typeorm_1.InjectRepository)(project_access_request_entity_1.ProjectAccessRequest)),
    __param(3, (0, common_1.Inject)((0, common_1.forwardRef)(() => activities_service_1.ActivitiesService))),
    __param(4, (0, common_1.Inject)((0, common_1.forwardRef)(() => projects_service_1.ProjectsService))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        users_service_1.UsersService,
        activities_service_1.ActivitiesService,
        projects_service_1.ProjectsService])
], ProjectCollaborationService);
//# sourceMappingURL=project-collaboration.service.js.map