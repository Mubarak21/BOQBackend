import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
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

@Module({
  imports: [
    ConfigModule.forRoot(),
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
      ],
      synchronize: process.env.NODE_ENV !== "production",
    }),
    TypeOrmModule.forFeature([User, Department]),
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
  ],
  providers: [SeedService, SeedCommand],
})
export class AppModule {}
