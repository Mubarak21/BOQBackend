import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "../auth/auth.module";
import { ProjectsModule } from "../projects/projects.module";
import { ActivitiesModule } from "../activities/activities.module";
import { UsersModule } from "../users/users.module";
import { DashboardModule } from "../dashboard/dashboard.module";
import { FinanceModule } from "../finance/finance.module";
import { Report } from "../entities/report.entity";
import { ReportsService } from "../reports/reports.service";
import { ReportGeneratorService } from "../reports/report-generator.service";
import { ReportsSchedulerService } from "../reports/reports-scheduler.service";
import { AdminAuthController } from "./controllers/auth/auth.controller";
import { AdminProjectsController } from "./controllers/projects/projects.controller";
import { AdminDashboardController } from "./controllers/dashboard/dashboard.controller";
import { AdminUsersController } from "./controllers/users/users.controller";
import { AdminActivitiesController } from "./controllers/activities/activities.controller";
import { AdminAnalyticsController } from "./controllers/analytics/analytics.controller";
import { AdminReportsController } from "./controllers/reports/reports.controller";
import { AdminFinanceController } from "./controllers/finance/finance.controller";
import { AdminSettingsController } from "./controllers/settings/settings.controller";
import { AdminProfileController } from "./controllers/profile/profile.controller";
import { Admin } from "../entities/admin.entity";
import { User } from "../entities/user.entity";
import { Project } from "../entities/project.entity";
import { Activity } from "../entities/activity.entity";
import { AdminService } from "./services/admin.service";

@Module({
  imports: [
    AuthModule,
    ProjectsModule,
    ActivitiesModule,
    UsersModule,
    DashboardModule,
    FinanceModule,
    TypeOrmModule.forFeature([Report, Admin, User, Project, Activity]),
  ],
  controllers: [
    AdminAuthController,
    AdminProjectsController,
    AdminDashboardController,
    AdminUsersController,
    AdminActivitiesController,
    AdminAnalyticsController,
    AdminReportsController,
    AdminFinanceController,
    AdminSettingsController,
    AdminProfileController,
  ],
  providers: [
    ReportsService,
    ReportGeneratorService,
    ReportsSchedulerService,
    AdminService,
  ],
  exports: [
    ReportsService,
    ReportGeneratorService,
    ReportsSchedulerService,
    AdminService,
  ],
})
export class AdminDashboardModule {}
