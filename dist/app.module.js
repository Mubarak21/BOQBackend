"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const nestjs_command_1 = require("nestjs-command");
const user_entity_1 = require("./entities/user.entity");
const project_entity_1 = require("./entities/project.entity");
const task_entity_1 = require("./entities/task.entity");
const comment_entity_1 = require("./entities/comment.entity");
const activity_entity_1 = require("./entities/activity.entity");
const phase_entity_1 = require("./entities/phase.entity");
const projects_module_1 = require("./projects/projects.module");
const tasks_module_1 = require("./tasks/tasks.module");
const comments_module_1 = require("./comments/comments.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const activities_module_1 = require("./activities/activities.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot(),
            typeorm_1.TypeOrmModule.forRoot({
                type: "postgres",
                host: process.env.DB_HOST || "localhost",
                port: parseInt(process.env.DB_PORT) || 5432,
                username: process.env.DB_USERNAME || "postgres",
                password: process.env.DB_PASSWORD || "postgres",
                database: process.env.DB_DATABASE || "project_tracker_db",
                entities: [user_entity_1.User, project_entity_1.Project, task_entity_1.Task, comment_entity_1.Comment, activity_entity_1.Activity, phase_entity_1.Phase],
                synchronize: process.env.NODE_ENV !== "production",
            }),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            projects_module_1.ProjectsModule,
            tasks_module_1.TasksModule,
            comments_module_1.CommentsModule,
            dashboard_module_1.DashboardModule,
            activities_module_1.ActivitiesModule,
            nestjs_command_1.CommandModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map