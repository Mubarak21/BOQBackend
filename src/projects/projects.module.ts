import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import { Project } from "../entities/project.entity";
import { Task } from "../entities/task.entity";
import { Phase } from "../entities/phase.entity";
import { ContractorPhase } from "../entities/contractor-phase.entity";
import { SubContractorPhase } from "../entities/sub-contractor-phase.entity";
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
import { DashboardModule } from "../dashboard/dashboard.module";
import { ComplaintsPenaltiesModule } from "../complaints-penalties/complaints-penalties.module";
import { PhaseEvidence } from "../entities/phase-evidence.entity";
import { EvidenceService } from "./evidence.service";
import { BoqParserService } from "./boq-parser.service";
import { BoqProgressGateway } from "./boq-progress.gateway";
import { Inventory } from "../entities/inventory.entity";
import { InventoryUsage } from "../entities/inventory-usage.entity";
import { ProjectBoq } from "../entities/project-boq.entity";
import { ProjectFinancialSummary } from "../entities/project-financial-summary.entity";
import { ProjectMetadata } from "../entities/project-metadata.entity";
import { ProjectSettings } from "../entities/project-settings.entity";
import { ProjectDashboardService } from "./services/project-dashboard.service";
import { ProjectConsultantService } from "./services/project-consultant.service";
import { ProjectContractorService } from "./services/project-contractor.service";
import { ProjectPhaseService } from "./services/project-phase.service";
import { ProjectBoqService } from "./services/project-boq.service";
import { ProjectCollaborationService } from "./services/project-collaboration.service";
import { EmailService } from "./email.service";

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      Project,
      Task,
      Phase,
      ContractorPhase,
      SubContractorPhase,
      SubPhase,
      CollaborationRequest,
      ProjectAccessRequest,
      PhaseEvidence,
      Inventory,
      InventoryUsage,
      ProjectBoq,
      ProjectFinancialSummary,
      ProjectMetadata,
      ProjectSettings,
    ]),
    UsersModule,
    forwardRef(() => AuthModule),
    forwardRef(() => ActivitiesModule),
    TasksModule,
    forwardRef(() => CommentsModule),
    forwardRef(() => DashboardModule),
    ComplaintsPenaltiesModule,
  ],
  providers: [
    ProjectsService,
    ProjectAccessService,
    SubPhasesService,
    EvidenceService,
    BoqParserService,
    BoqProgressGateway,
    ProjectDashboardService,
    ProjectConsultantService,
    ProjectContractorService,
    ProjectPhaseService,
    ProjectBoqService,
    ProjectCollaborationService,
    EmailService,
  ],
  controllers: [
    ProjectsController,
    CollaborationRequestsController,
    SubPhasesController,
  ],
  exports: [ProjectsService, ProjectDashboardService, ProjectConsultantService, ProjectContractorService, ProjectPhaseService, ProjectBoqService, ProjectCollaborationService, SubPhasesService, TypeOrmModule],
})
export class ProjectsModule {}
