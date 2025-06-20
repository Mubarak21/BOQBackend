import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Task } from "../entities/task.entity";
import { TasksService } from "./tasks.service";
import { TasksController } from "./tasks.controller";
import { UsersModule } from "../users/users.module";
import { ProjectsModule } from "../projects/projects.module";
import { AuthModule } from "../auth/auth.module";
import { Project } from "../entities/project.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, Task]),
    UsersModule,
    forwardRef(() => ProjectsModule),
    AuthModule,
  ],
  providers: [TasksService],
  controllers: [TasksController],
  exports: [TasksService],
})
export class TasksModule {}
