import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { CommandModule } from "nestjs-command";
import { ProjectsModule } from "./projects/projects.module";
import { TasksModule } from "./tasks/tasks.module";
import { CommentsModule } from "./comments/comments.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { ActivitiesModule } from "./activities/activities.module";
import { DepartmentsModule } from "./departments/departments.module";
import { SeedCommand, SeedService } from "./commands/seed.command";
import { ConsultantModule } from "./consultant/consultant.module";
import { AdminDashboardModule } from "./admin-dashboard/admin-dashboard.module";
import { FinanceModule } from "./finance/finance.module";
import { InventoryModule } from "./inventory/inventory.module";
import { ComplaintsPenaltiesModule } from "./complaints-penalties/complaints-penalties.module";
// Import entities needed by SeedService
import { User } from "./entities/user.entity";
import { Department } from "./entities/department.entity";
import { Project } from "./entities/project.entity";
import { Phase } from "./entities/phase.entity";
import { ContractorPhase } from "./entities/contractor-phase.entity";
import { SubContractorPhase } from "./entities/sub-contractor-phase.entity";
import { Task } from "./entities/task.entity";
import { BudgetCategory } from "./finance/entities/budget-category.entity";
import { ProjectTransaction } from "./finance/entities/project-transaction.entity";
import { ProjectSavings } from "./finance/entities/project-savings.entity";
import { BudgetAlert } from "./finance/entities/budget-alert.entity";
import { Admin } from "./entities/admin.entity";
import { Activity } from "./entities/activity.entity";
import { Report } from "./entities/report.entity";
import { Comment } from "./entities/comment.entity";
import { Complaint } from "./entities/complaint.entity";
import { SubPhase } from "./entities/sub-phase.entity";
import { Inventory } from "./entities/inventory.entity";
import { ProjectBoq } from "./entities/project-boq.entity";
// New normalized entities
import { ProjectFinancialSummary } from "./entities/project-financial-summary.entity";
import { ProjectMetadata } from "./entities/project-metadata.entity";
import { ProjectSettings } from "./entities/project-settings.entity";
import { Supplier } from "./entities/supplier.entity";
import { TransactionAttachment } from "./entities/transaction-attachment.entity";
import { TransactionApprovalHistory } from "./entities/transaction-approval-history.entity";
import { UserPreferences } from "./entities/user-preferences.entity";
import { UserSession } from "./entities/user-session.entity";
import { AuditLog } from "./entities/audit-log.entity";
import { InventoryUsageLog } from "./entities/inventory-usage-log.entity";
import { PhaseFinancialSummary } from "./entities/phase-financial-summary.entity";

@Module({
  imports: [
    ConfigModule.forRoot(),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || "postgres",
      password: process.env.DB_PASSWORD || "postgres",
      database: process.env.DB_DATABASE || "project_tracker_db",
      // Auto-load entities from feature modules (more efficient, reduces serialization overhead)
      // This automatically discovers entities from TypeOrmModule.forFeature() in feature modules
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV !== "production",
      // Add retry logic for database connections
      retryAttempts: 3,
      retryDelay: 3000,
      // Logging: Set to false to disable all SQL query logging, or use array for selective logging
      // Options: ["query", "error", "schema", "warn", "info", "log"]
      // Set to ["error", "warn"] to only log errors and warnings (recommended)
      logging: false, // Disable verbose SQL query logging
    }),
    // Register repositories needed by SeedService in AppModule
    // Note: autoLoadEntities handles entities in feature modules, but SeedService
    // needs direct access to these repositories in the root module context
    TypeOrmModule.forFeature([
      User,
      Department,
      Project,
      Phase,
      ContractorPhase,
      SubContractorPhase,
      Task,
      BudgetCategory,
      ProjectTransaction,
      ProjectSavings,
      BudgetAlert,
      Admin,
      Activity,
      Report,
      Comment,
      Complaint,
      SubPhase,
      Inventory,
      ProjectBoq,
      // New normalized entities
      ProjectFinancialSummary,
      ProjectMetadata,
      ProjectSettings,
      Supplier,
      TransactionAttachment,
      TransactionApprovalHistory,
      UserPreferences,
      UserSession,
      AuditLog,
      InventoryUsageLog,
      PhaseFinancialSummary,
    ]),
    AuthModule,
    UsersModule,
    forwardRef(() => ProjectsModule),
    TasksModule,
    CommentsModule,
    DashboardModule,
    ActivitiesModule,
    DepartmentsModule,
    CommandModule,
    ConsultantModule,
    AdminDashboardModule,
    FinanceModule,
    InventoryModule,
    ComplaintsPenaltiesModule,
  ],
  providers: [SeedService, SeedCommand],
})
export class AppModule {}
