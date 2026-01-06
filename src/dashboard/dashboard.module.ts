import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Project } from "../entities/project.entity";
import { User } from "../entities/user.entity";
import { Task } from "../entities/task.entity";
import { DashboardService } from "./dashboard.service";
import { DashboardController } from "./dashboard.controller";
import { AuthModule } from "../auth/auth.module";
import { Stats } from "../entities/stats.entity";
import { ProjectsModule } from "../projects/projects.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, User, Task, Stats]),
    AuthModule,
    forwardRef(() => ProjectsModule),
  ],
  providers: [DashboardService],
  controllers: [DashboardController],
  exports: [DashboardService],
})
export class DashboardModule {}
