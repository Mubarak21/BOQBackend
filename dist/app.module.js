"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const nestjs_command_1 = require("nestjs-command");
const user_entity_1 = require("./entities/user.entity");
const project_entity_1 = require("./entities/project.entity");
const task_entity_1 = require("./entities/task.entity");
const comment_entity_1 = require("./entities/comment.entity");
const activity_entity_1 = require("./entities/activity.entity");
const phase_entity_1 = require("./entities/phase.entity");
const projects_module_1 = require("./projects/projects.module");
const tasks_module_1 = require("./tasks/tasks.module");
const comments_module_1 = require("./comments/comments.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const activities_module_1 = require("./activities/activities.module");
const departments_module_1 = require("./departments/departments.module");
const department_entity_1 = require("./entities/department.entity");
const seed_command_1 = require("./commands/seed.command");
const consultant_module_1 = require("./consultant/consultant.module");
const sub_phase_entity_1 = require("./entities/sub-phase.entity");
const stats_entity_1 = require("./entities/stats.entity");
const admin_dashboard_module_1 = require("./admin-dashboard/admin-dashboard.module");
const admin_entity_1 = require("./entities/admin.entity");
const report_entity_1 = require("./entities/report.entity");
const budget_category_entity_1 = require("./finance/entities/budget-category.entity");
const project_transaction_entity_1 = require("./finance/entities/project-transaction.entity");
const project_savings_entity_1 = require("./finance/entities/project-savings.entity");
const budget_alert_entity_1 = require("./finance/entities/budget-alert.entity");
const financial_report_entity_1 = require("./finance/entities/financial-report.entity");
const finance_module_1 = require("./finance/finance.module");
const inventory_entity_1 = require("./entities/inventory.entity");
const inventory_module_1 = require("./inventory/inventory.module");
const complaint_entity_1 = require("./entities/complaint.entity");
const penalty_entity_1 = require("./entities/penalty.entity");
const phase_evidence_entity_1 = require("./entities/phase-evidence.entity");
const complaints_penalties_module_1 = require("./complaints-penalties/complaints-penalties.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot(),
            schedule_1.ScheduleModule.forRoot(),
            typeorm_1.TypeOrmModule.forRoot({
                type: "postgres",
                host: process.env.DB_HOST || "localhost",
                port: parseInt(process.env.DB_PORT) || 5432,
                username: process.env.DB_USERNAME || "postgres",
                password: process.env.DB_PASSWORD || "postgres",
                database: process.env.DB_DATABASE || "project_tracker_db",
                entities: [
                    user_entity_1.User,
                    project_entity_1.Project,
                    task_entity_1.Task,
                    comment_entity_1.Comment,
                    activity_entity_1.Activity,
                    phase_entity_1.Phase,
                    department_entity_1.Department,
                    sub_phase_entity_1.SubPhase,
                    stats_entity_1.Stats,
                    admin_entity_1.Admin,
                    report_entity_1.Report,
                    budget_category_entity_1.BudgetCategory,
                    project_transaction_entity_1.ProjectTransaction,
                    project_savings_entity_1.ProjectSavings,
                    budget_alert_entity_1.BudgetAlert,
                    financial_report_entity_1.FinancialReport,
                    inventory_entity_1.Inventory,
                    complaint_entity_1.Complaint,
                    penalty_entity_1.Penalty,
                    phase_evidence_entity_1.PhaseEvidence,
                ],
                synchronize: process.env.NODE_ENV !== "production",
            }),
            typeorm_1.TypeOrmModule.forFeature([
                user_entity_1.User,
                department_entity_1.Department,
                project_entity_1.Project,
                phase_entity_1.Phase,
                task_entity_1.Task,
                budget_category_entity_1.BudgetCategory,
                project_transaction_entity_1.ProjectTransaction,
                project_savings_entity_1.ProjectSavings,
                budget_alert_entity_1.BudgetAlert,
                admin_entity_1.Admin,
                activity_entity_1.Activity,
                report_entity_1.Report,
                comment_entity_1.Comment,
                complaint_entity_1.Complaint,
                sub_phase_entity_1.SubPhase,
            ]),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            projects_module_1.ProjectsModule,
            tasks_module_1.TasksModule,
            comments_module_1.CommentsModule,
            dashboard_module_1.DashboardModule,
            activities_module_1.ActivitiesModule,
            departments_module_1.DepartmentsModule,
            nestjs_command_1.CommandModule,
            consultant_module_1.ConsultantModule,
            admin_dashboard_module_1.AdminDashboardModule,
            finance_module_1.FinanceModule,
            inventory_module_1.InventoryModule,
            complaints_penalties_module_1.ComplaintsPenaltiesModule,
        ],
        providers: [seed_command_1.SeedService, seed_command_1.SeedCommand],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map