"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const project_entity_1 = require("../entities/project.entity");
const user_entity_1 = require("../entities/user.entity");
const task_entity_1 = require("../entities/task.entity");
const stats_entity_1 = require("../entities/stats.entity");
const comment_entity_1 = require("../entities/comment.entity");
const penalty_entity_1 = require("../entities/penalty.entity");
const complaint_entity_1 = require("../entities/complaint.entity");
const accident_entity_1 = require("../entities/accident.entity");
const daily_attendance_entity_1 = require("../entities/daily-attendance.entity");
const phase_evidence_entity_1 = require("../entities/phase-evidence.entity");
const phase_entity_1 = require("../entities/phase.entity");
const dashboard_service_1 = require("./dashboard.service");
const dashboard_controller_1 = require("./dashboard.controller");
const auth_module_1 = require("../auth/auth.module");
const projects_module_1 = require("../projects/projects.module");
let DashboardModule = class DashboardModule {
};
exports.DashboardModule = DashboardModule;
exports.DashboardModule = DashboardModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                project_entity_1.Project,
                user_entity_1.User,
                task_entity_1.Task,
                stats_entity_1.Stats,
                comment_entity_1.Comment,
                penalty_entity_1.Penalty,
                complaint_entity_1.Complaint,
                accident_entity_1.Accident,
                daily_attendance_entity_1.DailyAttendance,
                phase_evidence_entity_1.PhaseEvidence,
                phase_entity_1.Phase,
            ]),
            auth_module_1.AuthModule,
            (0, common_1.forwardRef)(() => projects_module_1.ProjectsModule),
        ],
        providers: [dashboard_service_1.DashboardService],
        controllers: [dashboard_controller_1.DashboardController],
        exports: [dashboard_service_1.DashboardService],
    })
], DashboardModule);
//# sourceMappingURL=dashboard.module.js.map