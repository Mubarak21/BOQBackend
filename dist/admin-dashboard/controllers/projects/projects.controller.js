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
exports.AdminProjectsController = void 0;
const common_1 = require("@nestjs/common");
const projects_service_1 = require("../../../projects/projects.service");
const create_project_dto_1 = require("../../../projects/dto/create-project.dto");
const update_project_dto_1 = require("../../../projects/dto/update-project.dto");
const jwt_auth_guard_1 = require("../../../auth/guards/jwt-auth.guard");
let AdminProjectsController = class AdminProjectsController {
    constructor(projectsService) {
        this.projectsService = projectsService;
    }
    async listProjects(search = "", status, page = 1, limit = 20) {
        return this.projectsService.adminList({ search, status, page, limit });
    }
    async getProject(id) {
        return this.projectsService.adminGetDetails(id);
    }
    async createProject(createProjectDto, req) {
        return this.projectsService.create(createProjectDto, req.user);
    }
    async updateProject(id, updateProjectDto, req) {
        return this.projectsService.update(id, updateProjectDto, req.user.id);
    }
    async deleteProject(id, req) {
        return this.projectsService.remove(id, req.user.id);
    }
};
exports.AdminProjectsController = AdminProjectsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)("search")),
    __param(1, (0, common_1.Query)("status")),
    __param(2, (0, common_1.Query)("page")),
    __param(3, (0, common_1.Query)("limit")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], AdminProjectsController.prototype, "listProjects", null);
__decorate([
    (0, common_1.Get)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminProjectsController.prototype, "getProject", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_project_dto_1.CreateProjectDto, Object]),
    __metadata("design:returntype", Promise)
], AdminProjectsController.prototype, "createProject", null);
__decorate([
    (0, common_1.Put)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_project_dto_1.UpdateProjectDto, Object]),
    __metadata("design:returntype", Promise)
], AdminProjectsController.prototype, "updateProject", null);
__decorate([
    (0, common_1.Delete)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminProjectsController.prototype, "deleteProject", null);
exports.AdminProjectsController = AdminProjectsController = __decorate([
    (0, common_1.Controller)("admin/projects"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [projects_service_1.ProjectsService])
], AdminProjectsController);
//# sourceMappingURL=projects.controller.js.map