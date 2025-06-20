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
      entities: [User, Project, Task, Comment, Activity, Phase],
      synchronize: process.env.NODE_ENV !== "production",
    }),
    AuthModule,
    UsersModule,
    ProjectsModule,
    TasksModule,
    CommentsModule,
    DashboardModule,
    ActivitiesModule,
    CommandModule,
  ],
})
export class AppModule {}
