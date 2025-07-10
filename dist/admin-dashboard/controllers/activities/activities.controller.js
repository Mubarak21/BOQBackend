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
exports.AdminActivitiesController = void 0;
const common_1 = require("@nestjs/common");
const activities_service_1 = require("../../../activities/activities.service");
const jwt_auth_guard_1 = require("../../../auth/guards/jwt-auth.guard");
let AdminActivitiesController = class AdminActivitiesController {
    constructor(activitiesService) {
        this.activitiesService = activitiesService;
    }
    async listActivities(userId, type, dateFrom, dateTo, projectId, search = "", page = 1, limit = 20) {
        return this.activitiesService.adminList({
            userId,
            type,
            dateFrom,
            dateTo,
            projectId,
            search,
            page,
            limit,
        });
    }
    async getActivity(id) {
        return this.activitiesService.adminGetDetails(id);
    }
};
exports.AdminActivitiesController = AdminActivitiesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)("userId")),
    __param(1, (0, common_1.Query)("type")),
    __param(2, (0, common_1.Query)("dateFrom")),
    __param(3, (0, common_1.Query)("dateTo")),
    __param(4, (0, common_1.Query)("projectId")),
    __param(5, (0, common_1.Query)("search")),
    __param(6, (0, common_1.Query)("page")),
    __param(7, (0, common_1.Query)("limit")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], AdminActivitiesController.prototype, "listActivities", null);
__decorate([
    (0, common_1.Get)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminActivitiesController.prototype, "getActivity", null);
exports.AdminActivitiesController = AdminActivitiesController = __decorate([
    (0, common_1.Controller)("admin/activities"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [activities_service_1.ActivitiesService])
], AdminActivitiesController);
//# sourceMappingURL=activities.controller.js.map