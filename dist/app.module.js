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
const projects_module_1 = require("./projects/projects.module");
const tasks_module_1 = require("./tasks/tasks.module");
const comments_module_1 = require("./comments/comments.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const activities_module_1 = require("./activities/activities.module");
const departments_module_1 = require("./departments/departments.module");
const seed_command_1 = require("./commands/seed.command");
const consultant_module_1 = require("./consultant/consultant.module");
const admin_dashboard_module_1 = require("./admin-dashboard/admin-dashboard.module");
const finance_module_1 = require("./finance/finance.module");
const inventory_module_1 = require("./inventory/inventory.module");
const complaints_penalties_module_1 = require("./complaints-penalties/complaints-penalties.module");
const attendance_module_1 = require("./attendance/attendance.module");
const accidents_module_1 = require("./accidents/accidents.module");
const equipment_module_1 = require("./equipment/equipment.module");
const documents_module_1 = require("./documents/documents.module");
const visitors_module_1 = require("./visitors/visitors.module");
const user_entity_1 = require("./entities/user.entity");
const department_entity_1 = require("./entities/department.entity");
const project_entity_1 = require("./entities/project.entity");
const phase_entity_1 = require("./entities/phase.entity");
const contractor_phase_entity_1 = require("./entities/contractor-phase.entity");
const sub_contractor_phase_entity_1 = require("./entities/sub-contractor-phase.entity");
const task_entity_1 = require("./entities/task.entity");
const budget_category_entity_1 = require("./finance/entities/budget-category.entity");
const project_transaction_entity_1 = require("./finance/entities/project-transaction.entity");
const project_savings_entity_1 = require("./finance/entities/project-savings.entity");
const budget_alert_entity_1 = require("./finance/entities/budget-alert.entity");
const admin_entity_1 = require("./entities/admin.entity");
const activity_entity_1 = require("./entities/activity.entity");
const report_entity_1 = require("./entities/report.entity");
const comment_entity_1 = require("./entities/comment.entity");
const complaint_entity_1 = require("./entities/complaint.entity");
const sub_phase_entity_1 = require("./entities/sub-phase.entity");
const inventory_entity_1 = require("./entities/inventory.entity");
const project_boq_entity_1 = require("./entities/project-boq.entity");
const project_financial_summary_entity_1 = require("./entities/project-financial-summary.entity");
const project_metadata_entity_1 = require("./entities/project-metadata.entity");
const project_settings_entity_1 = require("./entities/project-settings.entity");
const supplier_entity_1 = require("./entities/supplier.entity");
const transaction_attachment_entity_1 = require("./entities/transaction-attachment.entity");
const transaction_approval_history_entity_1 = require("./entities/transaction-approval-history.entity");
const user_preferences_entity_1 = require("./entities/user-preferences.entity");
const user_session_entity_1 = require("./entities/user-session.entity");
const audit_log_entity_1 = require("./entities/audit-log.entity");
const inventory_usage_log_entity_1 = require("./entities/inventory-usage-log.entity");
const phase_financial_summary_entity_1 = require("./entities/phase-financial-summary.entity");
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
                autoLoadEntities: true,
                synchronize: process.env.NODE_ENV !== "production",
                retryAttempts: 3,
                retryDelay: 3000,
                logging: false,
            }),
            typeorm_1.TypeOrmModule.forFeature([
                user_entity_1.User,
                department_entity_1.Department,
                project_entity_1.Project,
                phase_entity_1.Phase,
                contractor_phase_entity_1.ContractorPhase,
                sub_contractor_phase_entity_1.SubContractorPhase,
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
                inventory_entity_1.Inventory,
                project_boq_entity_1.ProjectBoq,
                project_financial_summary_entity_1.ProjectFinancialSummary,
                project_metadata_entity_1.ProjectMetadata,
                project_settings_entity_1.ProjectSettings,
                supplier_entity_1.Supplier,
                transaction_attachment_entity_1.TransactionAttachment,
                transaction_approval_history_entity_1.TransactionApprovalHistory,
                user_preferences_entity_1.UserPreferences,
                user_session_entity_1.UserSession,
                audit_log_entity_1.AuditLog,
                inventory_usage_log_entity_1.InventoryUsageLog,
                phase_financial_summary_entity_1.PhaseFinancialSummary,
            ]),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            (0, common_1.forwardRef)(() => projects_module_1.ProjectsModule),
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
            attendance_module_1.AttendanceModule,
            accidents_module_1.AccidentsModule,
            equipment_module_1.EquipmentModule,
            documents_module_1.DocumentsModule,
            visitors_module_1.VisitorsModule,
        ],
        providers: [seed_command_1.SeedService, seed_command_1.SeedCommand],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map