import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Project } from "../entities/project.entity";
import { User } from "../entities/user.entity";
import { Task } from "../entities/task.entity";
import { Stats } from "../entities/stats.entity";
import { Comment } from "../entities/comment.entity";
import { Penalty } from "../entities/penalty.entity";
import { Complaint } from "../entities/complaint.entity";
import { Accident } from "../entities/accident.entity";
import { DailyAttendance } from "../entities/daily-attendance.entity";
import { PhaseEvidence } from "../entities/phase-evidence.entity";
import { Phase } from "../entities/phase.entity";
import { DashboardService } from "./dashboard.service";
import { DashboardController } from "./dashboard.controller";
import { AuthModule } from "../auth/auth.module";
import { ProjectsModule } from "../projects/projects.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Project,
      User,
      Task,
      Stats,
      Comment,
      Penalty,
      Complaint,
      Accident,
      DailyAttendance,
      PhaseEvidence,
      Phase,
    ]),
    AuthModule,
    forwardRef(() => ProjectsModule),
  ],
  providers: [DashboardService],
  controllers: [DashboardController],
  exports: [DashboardService],
})
export class DashboardModule {}
