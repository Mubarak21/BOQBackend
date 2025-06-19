import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Project } from "../entities/project.entity";
import { Task } from "../entities/task.entity";
import { ProjectsService } from "./projects.service";
import { ProjectsController } from "./projects.controller";
import { UsersModule } from "../users/users.module";
import { AuthModule } from "../auth/auth.module";
import { ActivitiesModule } from "../activities/activities.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, Task]),
    UsersModule,
    AuthModule,
    ActivitiesModule,
  ],
  providers: [ProjectsService],
  controllers: [ProjectsController],
  exports: [ProjectsService],
})
export class ProjectsModule {}
