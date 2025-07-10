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
exports.AdminDashboardController = void 0;
const common_1 = require("@nestjs/common");
const projects_service_1 = require("../../../projects/projects.service");
const users_service_1 = require("../../../users/users.service");
const activities_service_1 = require("../../../activities/activities.service");
const jwt_auth_guard_1 = require("../../../auth/guards/jwt-auth.guard");
let AdminDashboardController = class AdminDashboardController {
    constructor(projectsService, usersService, activitiesService) {
        this.projectsService = projectsService;
        this.usersService = usersService;
        this.activitiesService = activitiesService;
    }
    async getMetrics() {
        const [totalProjects, totalUsers, totalActivities] = await Promise.all([
            this.projectsService.countAll(),
            this.usersService.countAll(),
            this.activitiesService.countAll(),
        ]);
        return {
            totalProjects,
            totalUsers,
            totalActivities,
        };
    }
    async getRecentActivities(limit = 10) {
        return this.activitiesService.getRecentActivities(limit);
    }
    async getTrends(metric = "projects", period = "monthly") {
        switch (metric) {
            case "projects":
                return this.projectsService.getTrends(period);
            case "users":
                return this.usersService.getTrends(period);
            case "activities":
                return this.activitiesService.getTrends(period);
            default:
                return { error: "Invalid metric" };
        }
    }
    async getTopUsers(limit = 5) {
        return this.usersService.getTopActiveUsers(limit);
    }
    async getTopProjects(limit = 5) {
        return this.projectsService.getTopActiveProjects(limit);
    }
};
exports.AdminDashboardController = AdminDashboardController;
__decorate([
    (0, common_1.Get)("metrics"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminDashboardController.prototype, "getMetrics", null);
__decorate([
    (0, common_1.Get)("recent-activities"),
    __param(0, (0, common_1.Query)("limit")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminDashboardController.prototype, "getRecentActivities", null);
__decorate([
    (0, common_1.Get)("trends"),
    __param(0, (0, common_1.Query)("metric")),
    __param(1, (0, common_1.Query)("period")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminDashboardController.prototype, "getTrends", null);
__decorate([
    (0, common_1.Get)("top-users"),
    __param(0, (0, common_1.Query)("limit")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminDashboardController.prototype, "getTopUsers", null);
__decorate([
    (0, common_1.Get)("top-projects"),
    __param(0, (0, common_1.Query)("limit")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminDashboardController.prototype, "getTopProjects", null);
exports.AdminDashboardController = AdminDashboardController = __decorate([
    (0, common_1.Controller)("admin/dashboard"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [projects_service_1.ProjectsService,
        users_service_1.UsersService,
        activities_service_1.ActivitiesService])
], AdminDashboardController);
//# sourceMappingURL=dashboard.controller.js.map