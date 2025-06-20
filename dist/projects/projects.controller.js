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
const platform_express_1 = require("@nestjs/platform-express");
const projects_service_1 = require("./projects.service");
const create_project_dto_1 = require("./dto/create-project.dto");
const update_project_dto_1 = require("./dto/update-project.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const users_service_1 = require("../users/users.service");
const create_phase_dto_1 = require("./dto/create-phase.dto");
const update_phase_dto_1 = require("./dto/update-phase.dto");
let ProjectsController = class ProjectsController {
    constructor(projectsService, usersService) {
        this.projectsService = projectsService;
        this.usersService = usersService;
    }
    create(createProjectDto, req) {
        return this.projectsService.create(createProjectDto, req.user);
    }
    findAll(req) {
        return this.projectsService.findAll(req.user.id);
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
    async addCollaborator(id, userId, req) {
        const collaborator = await this.usersService.findOne(userId);
        return this.projectsService.addCollaborator(id, collaborator, req.user.id);
    }
    removeCollaborator(id, userId, req) {
        return this.projectsService.removeCollaborator(id, userId, req.user.id);
    }
    async uploadBoq(id, file, req) {
        if (!file) {
            throw new common_1.BadRequestException("No file uploaded");
        }
        if (!file.mimetype.includes("spreadsheet") &&
            !file.mimetype.includes("excel")) {
            throw new common_1.BadRequestException("File must be an Excel spreadsheet");
        }
        return this.projectsService.processBoqFile(id, file, req.user.id);
    }
    async createPhase(id, createPhaseDto, req) {
        return this.projectsService.createPhase(id, createPhaseDto, req.user.id);
    }
    async getProjectPhases(id, req) {
        return this.projectsService.getProjectPhases(id, req.user.id);
    }
    async getAvailableAssignees(req) {
        const projectId = req.query.projectId;
        if (!projectId) {
            throw new common_1.BadRequestException("projectId query parameter is required");
        }
        return this.projectsService.getAvailableAssignees(projectId);
    }
    async updatePhase(projectId, phaseId, updatePhaseDto, req) {
        return this.projectsService.updatePhase(projectId, phaseId, updatePhaseDto, req.user.id);
    }
    async deletePhase(projectId, phaseId, req) {
        await this.projectsService.deletePhase(projectId, phaseId, req.user.id);
        return { message: "Phase deleted successfully" };
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
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ProjectsController.prototype, "findAll", null);
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
    (0, common_1.Post)(":id/boq"),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)("file")),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "uploadBoq", null);
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
    (0, common_1.Get)(":id/phases"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "getProjectPhases", null);
__decorate([
    (0, common_1.Get)("available-assignees"),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProjectsController.prototype, "getAvailableAssignees", null);
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
exports.ProjectsController = ProjectsController = __decorate([
    (0, common_1.Controller)("projects"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [projects_service_1.ProjectsService,
        users_service_1.UsersService])
], ProjectsController);
//# sourceMappingURL=projects.controller.js.map