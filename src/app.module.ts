import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { CommandModule } from "nestjs-command";
import { User } from "./entities/user.entity";
import { Project } from "./entities/project.entity";
import { Task } from "./entities/task.entity";
import { Comment } from "./entities/comment.entity";
import { Activity } from "./entities/activity.entity";
import { Phase } from "./entities/phase.entity";
import { ProjectsModule } from "./projects/projects.module";
import { TasksModule } from "./tasks/tasks.module";
import { CommentsModule } from "./comments/comments.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { ActivitiesModule } from "./activities/activities.module";
import { DepartmentsModule } from "./departments/departments.module";
import { Department } from "./entities/department.entity";
import { SeedCommand, SeedService } from "./commands/seed.command";
import { ConsultantModule } from "./consultant/consultant.module";
import { SubPhase } from "./entities/sub-phase.entity";
import { Stats } from "./entities/stats.entity";
import { AdminDashboardModule } from "./admin-dashboard/admin-dashboard.module";
import { Admin } from "./entities/admin.entity";
import { Report } from "./entities/report.entity";
import { BudgetCategory } from "./finance/entities/budget-category.entity";
import { ProjectTransaction } from "./finance/entities/project-transaction.entity";
import { ProjectSavings } from "./finance/entities/project-savings.entity";
import { BudgetAlert } from "./finance/entities/budget-alert.entity";
import { FinancialReport } from "./finance/entities/financial-report.entity";
import { FinanceModule } from "./finance/finance.module";
import { Inventory } from "./entities/inventory.entity";
import { InventoryModule } from "./inventory/inventory.module";
import { Complaint } from "./entities/complaint.entity";
import { Penalty } from "./entities/penalty.entity";
import { PhaseEvidence } from "./entities/phase-evidence.entity";
import { ComplaintsPenaltiesModule } from "./complaints-penalties/complaints-penalties.module";

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
      entities: [
        User,
        Project,
        Task,
        Comment,
        Activity,
        Phase,
        Department,
        SubPhase,
        Stats,
        Admin,
        Report,
        BudgetCategory,
        ProjectTransaction,
        ProjectSavings,
        BudgetAlert,
        FinancialReport,
        Inventory,
        Complaint,
        Penalty,
        PhaseEvidence,
      ],
      synchronize: process.env.NODE_ENV !== "production",
    }),
    TypeOrmModule.forFeature([
      User,
      Department,
      Project,
      Phase,
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
    ]),
    AuthModule,
    UsersModule,
    ProjectsModule,
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
