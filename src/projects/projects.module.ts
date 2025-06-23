import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Project } from "../entities/project.entity";
import { Task } from "../entities/task.entity";
import { Phase } from "../entities/phase.entity";
import { ProjectsService } from "./projects.service";
import { ProjectsController } from "./projects.controller";
import { UsersModule } from "../users/users.module";
import { AuthModule } from "../auth/auth.module";
import { ActivitiesModule } from "../activities/activities.module";
import { TasksModule } from "../tasks/tasks.module";
import { ProjectAccessService } from "./services/project-access.service";
import { CollaborationRequest } from "../entities/collaboration-request.entity";
import { CollaborationRequestsController } from "../collaboration-requests.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, Task, Phase, CollaborationRequest]),
    UsersModule,
    AuthModule,
    ActivitiesModule,
    TasksModule,
  ],
  providers: [ProjectsService, ProjectAccessService],
  controllers: [ProjectsController, CollaborationRequestsController],
  exports: [ProjectsService],
})
export class ProjectsModule {}
