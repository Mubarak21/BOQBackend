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
exports.DashboardController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const dashboard_service_1 = require("./dashboard.service");
const projects_service_1 = require("../projects/projects.service");
let DashboardController = class DashboardController {
    constructor(dashboardService, projectsService) {
        this.dashboardService = dashboardService;
        this.projectsService = projectsService;
    }
    async getStats(req) {
        return this.dashboardService.getStats(req.user.id, req.user.role);
    }
    async getMyProjects(req) {
        const userProjects = await this.projectsService.findUserProjects(req.user.id);
        return Promise.all(userProjects.map((p) => this.projectsService.getProjectResponse(p)));
    }
    async getRecentActivity(req, limit = "10") {
        const userProjects = await this.projectsService.findUserProjects(req.user.id);
        const recentProjects = userProjects
            .sort((a, b) => b.updated_at.getTime() - a.updated_at.getTime())
            .slice(0, parseInt(limit));
        return Promise.all(recentProjects.map((p) => this.projectsService.getProjectResponse(p)));
    }
    async getDashboardSummary(req) {
        const [stats, recentProjects] = await Promise.all([
            this.dashboardService.getUserStatsForDashboard(req.user.id, req.user.role),
            this.getMyProjects(req),
        ]);
        return {
            stats,
            recentProjects: recentProjects.slice(0, 5),
            totalProjects: recentProjects.length,
        };
    }
};
exports.DashboardController = DashboardController;
__decorate([
    (0, common_1.Get)("stats"),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)("my-projects"),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getMyProjects", null);
__decorate([
    (0, common_1.Get)("recent-activity"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)("limit")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getRecentActivity", null);
__decorate([
    (0, common_1.Get)("summary"),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "getDashboardSummary", null);
exports.DashboardController = DashboardController = __decorate([
    (0, common_1.Controller)("dashboard"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [dashboard_service_1.DashboardService,
        projects_service_1.ProjectsService])
], DashboardController);
//# sourceMappingURL=dashboard.controller.js.map