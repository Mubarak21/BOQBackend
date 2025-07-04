import { Module, forwardRef } from "@nestjs/common";
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
import { ProjectAccessRequest } from "../entities/project-access-request.entity";
import { CommentsModule } from "../comments/comments.module";
import { SubPhase } from "../entities/sub-phase.entity";
import { SubPhasesController } from "./subphases.controller";
import { SubPhasesService } from "./subphases.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Project,
      Task,
      Phase,
      SubPhase,
      CollaborationRequest,
      ProjectAccessRequest,
    ]),
    UsersModule,
    AuthModule,
    forwardRef(() => ActivitiesModule),
    TasksModule,
    forwardRef(() => CommentsModule),
  ],
  providers: [ProjectsService, ProjectAccessService, SubPhasesService],
  controllers: [
    ProjectsController,
    CollaborationRequestsController,
    SubPhasesController,
  ],
  exports: [ProjectsService, TypeOrmModule],
})
export class ProjectsModule {}
