import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "../auth/auth.module";
import { ProjectsModule } from "../projects/projects.module";
import { ActivitiesModule } from "../activities/activities.module";
import { UsersModule } from "../users/users.module";
import { Report } from "../entities/report.entity";
import { ReportsService } from "../reports/reports.service";
import { AdminAuthController } from "./controllers/auth/auth.controller";
import { AdminProjectsController } from "./controllers/projects/projects.controller";
import { AdminDashboardController } from "./controllers/dashboard/dashboard.controller";
import { AdminUsersController } from "./controllers/users/users.controller";
import { AdminActivitiesController } from "./controllers/activities/activities.controller";
import { AdminAnalyticsController } from "./controllers/analytics/analytics.controller";
import { AdminReportsController } from "./controllers/reports/reports.controller";
import { Admin } from "../entities/admin.entity";

@Module({
  imports: [
    AuthModule,
    ProjectsModule,
    ActivitiesModule,
    UsersModule,
    TypeOrmModule.forFeature([Report, Admin]),
  ],
  controllers: [
    AdminAuthController,
    AdminProjectsController,
    AdminDashboardController,
    AdminUsersController,
    AdminActivitiesController,
    AdminAnalyticsController,
    AdminReportsController,
  ],
  providers: [ReportsService],
})
export class AdminDashboardModule {}
