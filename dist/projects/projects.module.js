"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const project_entity_1 = require("../entities/project.entity");
const task_entity_1 = require("../entities/task.entity");
const phase_entity_1 = require("../entities/phase.entity");
const projects_service_1 = require("./projects.service");
const projects_controller_1 = require("./projects.controller");
const users_module_1 = require("../users/users.module");
const auth_module_1 = require("../auth/auth.module");
const activities_module_1 = require("../activities/activities.module");
const tasks_module_1 = require("../tasks/tasks.module");
const project_access_service_1 = require("./services/project-access.service");
const collaboration_request_entity_1 = require("../entities/collaboration-request.entity");
const collaboration_requests_controller_1 = require("../collaboration-requests.controller");
const project_access_request_entity_1 = require("../entities/project-access-request.entity");
const comments_module_1 = require("../comments/comments.module");
const sub_phase_entity_1 = require("../entities/sub-phase.entity");
const subphases_controller_1 = require("./subphases.controller");
const subphases_service_1 = require("./subphases.service");
const dashboard_module_1 = require("../dashboard/dashboard.module");
const complaints_penalties_module_1 = require("../complaints-penalties/complaints-penalties.module");
const phase_evidence_entity_1 = require("../entities/phase-evidence.entity");
const evidence_service_1 = require("./evidence.service");
const boq_parser_service_1 = require("./boq-parser.service");
const boq_progress_gateway_1 = require("./boq-progress.gateway");
const inventory_entity_1 = require("../entities/inventory.entity");
const inventory_usage_entity_1 = require("../entities/inventory-usage.entity");
const project_dashboard_service_1 = require("./services/project-dashboard.service");
const project_consultant_service_1 = require("./services/project-consultant.service");
const project_contractor_service_1 = require("./services/project-contractor.service");
const project_phase_service_1 = require("./services/project-phase.service");
const project_boq_service_1 = require("./services/project-boq.service");
const project_collaboration_service_1 = require("./services/project-collaboration.service");
const email_service_1 = require("./email.service");
let ProjectsModule = class ProjectsModule {
};
exports.ProjectsModule = ProjectsModule;
exports.ProjectsModule = ProjectsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            typeorm_1.TypeOrmModule.forFeature([
                project_entity_1.Project,
                task_entity_1.Task,
                phase_entity_1.Phase,
                sub_phase_entity_1.SubPhase,
                collaboration_request_entity_1.CollaborationRequest,
                project_access_request_entity_1.ProjectAccessRequest,
                phase_evidence_entity_1.PhaseEvidence,
                inventory_entity_1.Inventory,
                inventory_usage_entity_1.InventoryUsage,
            ]),
            users_module_1.UsersModule,
            (0, common_1.forwardRef)(() => auth_module_1.AuthModule),
            (0, common_1.forwardRef)(() => activities_module_1.ActivitiesModule),
            tasks_module_1.TasksModule,
            (0, common_1.forwardRef)(() => comments_module_1.CommentsModule),
            (0, common_1.forwardRef)(() => dashboard_module_1.DashboardModule),
            complaints_penalties_module_1.ComplaintsPenaltiesModule,
        ],
        providers: [
            projects_service_1.ProjectsService,
            project_access_service_1.ProjectAccessService,
            subphases_service_1.SubPhasesService,
            evidence_service_1.EvidenceService,
            boq_parser_service_1.BoqParserService,
            boq_progress_gateway_1.BoqProgressGateway,
            project_dashboard_service_1.ProjectDashboardService,
            project_consultant_service_1.ProjectConsultantService,
            project_contractor_service_1.ProjectContractorService,
            project_phase_service_1.ProjectPhaseService,
            project_boq_service_1.ProjectBoqService,
            project_collaboration_service_1.ProjectCollaborationService,
            email_service_1.EmailService,
        ],
        controllers: [
            projects_controller_1.ProjectsController,
            collaboration_requests_controller_1.CollaborationRequestsController,
            subphases_controller_1.SubPhasesController,
        ],
        exports: [projects_service_1.ProjectsService, project_dashboard_service_1.ProjectDashboardService, project_consultant_service_1.ProjectConsultantService, project_contractor_service_1.ProjectContractorService, project_phase_service_1.ProjectPhaseService, project_boq_service_1.ProjectBoqService, project_collaboration_service_1.ProjectCollaborationService, typeorm_1.TypeOrmModule],
    })
], ProjectsModule);
//# sourceMappingURL=projects.module.js.map