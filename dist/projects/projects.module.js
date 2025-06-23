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
let ProjectsModule = class ProjectsModule {
};
exports.ProjectsModule = ProjectsModule;
exports.ProjectsModule = ProjectsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([project_entity_1.Project, task_entity_1.Task, phase_entity_1.Phase, collaboration_request_entity_1.CollaborationRequest]),
            users_module_1.UsersModule,
            auth_module_1.AuthModule,
            activities_module_1.ActivitiesModule,
            tasks_module_1.TasksModule,
        ],
        providers: [projects_service_1.ProjectsService, project_access_service_1.ProjectAccessService],
        controllers: [projects_controller_1.ProjectsController, collaboration_requests_controller_1.CollaborationRequestsController],
        exports: [projects_service_1.ProjectsService],
    })
], ProjectsModule);
//# sourceMappingURL=projects.module.js.map