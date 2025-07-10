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
exports.AdminAnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const projects_service_1 = require("../../../projects/projects.service");
const users_service_1 = require("../../../users/users.service");
const activities_service_1 = require("../../../activities/activities.service");
const jwt_auth_guard_1 = require("../../../auth/guards/jwt-auth.guard");
let AdminAnalyticsController = class AdminAnalyticsController {
    constructor(projectsService, usersService, activitiesService) {
        this.projectsService = projectsService;
        this.usersService = usersService;
        this.activitiesService = activitiesService;
    }
    async projectsCreated(period = "monthly", from, to) {
        return this.projectsService.getTrends(period, from, to);
    }
    async userSignups(period = "monthly", from, to) {
        return this.usersService.getTrends(period, from, to);
    }
    async activities(period = "monthly", from, to) {
        return this.activitiesService.getTrends(period, from, to);
    }
    async projectsByStatus() {
        return this.projectsService.getGroupedByStatus();
    }
    async usersByRole() {
        return this.usersService.getGroupedByRole();
    }
    async userGrowth(compare = "month") {
        return this.usersService.getUserGrowth(compare);
    }
};
exports.AdminAnalyticsController = AdminAnalyticsController;
__decorate([
    (0, common_1.Get)("projects-created"),
    __param(0, (0, common_1.Query)("period")),
    __param(1, (0, common_1.Query)("from")),
    __param(2, (0, common_1.Query)("to")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AdminAnalyticsController.prototype, "projectsCreated", null);
__decorate([
    (0, common_1.Get)("user-signups"),
    __param(0, (0, common_1.Query)("period")),
    __param(1, (0, common_1.Query)("from")),
    __param(2, (0, common_1.Query)("to")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AdminAnalyticsController.prototype, "userSignups", null);
__decorate([
    (0, common_1.Get)("activities"),
    __param(0, (0, common_1.Query)("period")),
    __param(1, (0, common_1.Query)("from")),
    __param(2, (0, common_1.Query)("to")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AdminAnalyticsController.prototype, "activities", null);
__decorate([
    (0, common_1.Get)("projects-by-status"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminAnalyticsController.prototype, "projectsByStatus", null);
__decorate([
    (0, common_1.Get)("users-by-role"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminAnalyticsController.prototype, "usersByRole", null);
__decorate([
    (0, common_1.Get)("user-growth"),
    __param(0, (0, common_1.Query)("compare")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminAnalyticsController.prototype, "userGrowth", null);
exports.AdminAnalyticsController = AdminAnalyticsController = __decorate([
    (0, common_1.Controller)("admin/analytics"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [projects_service_1.ProjectsService,
        users_service_1.UsersService,
        activities_service_1.ActivitiesService])
], AdminAnalyticsController);
//# sourceMappingURL=analytics.controller.js.map