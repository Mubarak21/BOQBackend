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
const project_dashboard_service_1 = require("../../../projects/services/project-dashboard.service");
const users_service_1 = require("../../../users/users.service");
const activities_service_1 = require("../../../activities/activities.service");
const jwt_auth_guard_1 = require("../../../auth/guards/jwt-auth.guard");
let AdminDashboardController = class AdminDashboardController {
    constructor(projectsService, projectDashboardService, usersService, activitiesService) {
        this.projectsService = projectsService;
        this.projectDashboardService = projectDashboardService;
        this.usersService = usersService;
        this.activitiesService = activitiesService;
    }
    async getMetrics() {
        console.log("🔍 Admin Dashboard - Fetching metrics...");
        const [totalProjects, totalUsers, totalActivities] = await Promise.all([
            this.projectsService.countAll(),
            this.usersService.countAll(),
            this.activitiesService.countAll(),
        ]);
        const metrics = {
            totalProjects,
            totalUsers,
            totalActivities,
        };
        console.log("📊 Admin Dashboard Metrics:", metrics);
        return metrics;
    }
    async getStats(req) {
        console.log("🔍 Consultant Dashboard - Fetching comprehensive stats...");
        const startTime = Date.now();
        const [projectStats, phaseStats, teamMembersCount, monthlyGrowth] = await Promise.all([
            this.projectDashboardService.getDashboardProjectStats(),
            this.projectDashboardService.getDashboardPhaseStats(),
            this.projectDashboardService.getDashboardTeamMembersCount(),
            this.projectDashboardService.getDashboardMonthlyGrowth()
        ]);
        const stats = {
            totalProjects: projectStats.total,
            activeProjects: projectStats.active,
            completedProjects: projectStats.completed,
            totalValue: projectStats.totalValue,
            monthlyGrowth: monthlyGrowth,
            teamMembers: teamMembersCount,
            phaseStats: {
                totalPhases: phaseStats.total,
                completedPhases: phaseStats.completed,
                inProgressPhases: phaseStats.inProgress,
                totalBudget: phaseStats.totalBudget,
                completionRate: phaseStats.completionRate,
            },
        };
        const duration = Date.now() - startTime;
        console.log(`📊 Consultant Dashboard Stats (${duration}ms):`, stats);
        return stats;
    }
    async getRecentActivities(limit = 10) {
        console.log("🔍 Admin Dashboard - Fetching recent activities (limit:", limit, ")");
        const activities = await this.activitiesService.getRecentActivities(limit);
        console.log("📊 Admin Dashboard Recent Activities:", activities);
        return activities;
    }
    async getTrends(metric = "projects", period = "monthly", from, to) {
        switch (metric) {
            case "projects":
                return this.projectsService.getTrends(period, from, to);
            case "users":
                return this.usersService.getTrends(period, from, to);
            case "activities":
                return this.activitiesService.getTrends(period, from, to);
            default:
                return { error: "Invalid metric" };
        }
    }
    async getTopUsers(limit = 5) {
        return this.usersService.getTopActiveUsers(limit);
    }
    async getTopProjects(limit = 5) {
        console.log("🔍 Admin Dashboard - Fetching top projects (limit:", limit, ")");
        const projects = await this.projectsService.getTopActiveProjects(limit);
        console.log("📊 Admin Dashboard Top Projects:", projects);
        return projects;
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
    (0, common_1.Get)("stats"),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminDashboardController.prototype, "getStats", null);
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
    __param(2, (0, common_1.Query)("from")),
    __param(3, (0, common_1.Query)("to")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
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
    (0, common_1.Controller)("consultant/dashboard"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [projects_service_1.ProjectsService,
        project_dashboard_service_1.ProjectDashboardService,
        users_service_1.UsersService,
        activities_service_1.ActivitiesService])
], AdminDashboardController);
//# sourceMappingURL=dashboard.controller.js.map