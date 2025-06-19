import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Task } from "../entities/task.entity";
import { TasksService } from "./tasks.service";
import { TasksController } from "./tasks.controller";
import { UsersModule } from "../users/users.module";
import { ProjectsModule } from "../projects/projects.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Task]),
    UsersModule,
    ProjectsModule,
    AuthModule,
  ],
  providers: [TasksService],
  controllers: [TasksController],
  exports: [TasksService],
})
export class TasksModule {}
