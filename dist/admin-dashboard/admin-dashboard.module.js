"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminDashboardModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const auth_module_1 = require("../auth/auth.module");
const projects_module_1 = require("../projects/projects.module");
const activities_module_1 = require("../activities/activities.module");
const users_module_1 = require("../users/users.module");
const report_entity_1 = require("../entities/report.entity");
const reports_service_1 = require("../reports/reports.service");
const auth_controller_1 = require("./controllers/auth/auth.controller");
const projects_controller_1 = require("./controllers/projects/projects.controller");
const dashboard_controller_1 = require("./controllers/dashboard/dashboard.controller");
const users_controller_1 = require("./controllers/users/users.controller");
const activities_controller_1 = require("./controllers/activities/activities.controller");
const analytics_controller_1 = require("./controllers/analytics/analytics.controller");
const reports_controller_1 = require("./controllers/reports/reports.controller");
const admin_entity_1 = require("../entities/admin.entity");
let AdminDashboardModule = class AdminDashboardModule {
};
exports.AdminDashboardModule = AdminDashboardModule;
exports.AdminDashboardModule = AdminDashboardModule = __decorate([
    (0, common_1.Module)({
        imports: [
            auth_module_1.AuthModule,
            projects_module_1.ProjectsModule,
            activities_module_1.ActivitiesModule,
            users_module_1.UsersModule,
            typeorm_1.TypeOrmModule.forFeature([report_entity_1.Report, admin_entity_1.Admin]),
        ],
        controllers: [
            auth_controller_1.AdminAuthController,
            projects_controller_1.AdminProjectsController,
            dashboard_controller_1.AdminDashboardController,
            users_controller_1.AdminUsersController,
            activities_controller_1.AdminActivitiesController,
            analytics_controller_1.AdminAnalyticsController,
            reports_controller_1.AdminReportsController,
        ],
        providers: [reports_service_1.ReportsService],
    })
], AdminDashboardModule);
//# sourceMappingURL=admin-dashboard.module.js.map