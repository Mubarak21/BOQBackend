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
exports.ConsultantController = void 0;
const common_1 = require("@nestjs/common");
const projects_service_1 = require("../projects/projects.service");
const comments_service_1 = require("../comments/comments.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let ConsultantController = class ConsultantController {
    constructor(projectsService, commentsService) {
        this.projectsService = projectsService;
        this.commentsService = commentsService;
    }
    async getAllProjects(req) {
        return this.projectsService.getAllConsultantProjects();
    }
    async getProjectDetails(id, req) {
        return this.projectsService.getConsultantProjectDetails(id);
    }
    async getProjectPhases(id, req) {
        return this.projectsService.getConsultantProjectPhases(id);
    }
    async getProjectTasks(projectId, req) {
        return this.projectsService.getConsultantProjectTasks(projectId);
    }
    async getProjectFeedback(projectId, req) {
        return this.commentsService.listConsultantFeedbackByProject(projectId);
    }
    async createFeedback(body, req) {
        return this.commentsService.createConsultantFeedback(body.projectId, body.content, req.user);
    }
};
exports.ConsultantController = ConsultantController;
__decorate([
    (0, common_1.Get)("projects"),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ConsultantController.prototype, "getAllProjects", null);
__decorate([
    (0, common_1.Get)("projects/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ConsultantController.prototype, "getProjectDetails", null);
__decorate([
    (0, common_1.Get)("projects/:id/phases"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ConsultantController.prototype, "getProjectPhases", null);
__decorate([
    (0, common_1.Get)("tasks"),
    __param(0, (0, common_1.Query)("projectId")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ConsultantController.prototype, "getProjectTasks", null);
__decorate([
    (0, common_1.Get)("feedback"),
    __param(0, (0, common_1.Query)("projectId")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ConsultantController.prototype, "getProjectFeedback", null);
__decorate([
    (0, common_1.Post)("feedback"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ConsultantController.prototype, "createFeedback", null);
exports.ConsultantController = ConsultantController = __decorate([
    (0, common_1.Controller)("consultant"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [projects_service_1.ProjectsService,
        comments_service_1.CommentsService])
], ConsultantController);
//# sourceMappingURL=consultant.controller.js.map