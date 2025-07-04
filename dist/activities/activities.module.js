"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivitiesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const activities_service_1 = require("./activities.service");
const activities_controller_1 = require("./activities.controller");
const activity_entity_1 = require("../entities/activity.entity");
const auth_module_1 = require("../auth/auth.module");
const projects_module_1 = require("../projects/projects.module");
let ActivitiesModule = class ActivitiesModule {
};
exports.ActivitiesModule = ActivitiesModule;
exports.ActivitiesModule = ActivitiesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([activity_entity_1.Activity]),
            auth_module_1.AuthModule,
            (0, common_1.forwardRef)(() => projects_module_1.ProjectsModule),
        ],
        controllers: [activities_controller_1.ActivitiesController],
        providers: [activities_service_1.ActivitiesService],
        exports: [activities_service_1.ActivitiesService],
    })
], ActivitiesModule);
//# sourceMappingURL=activities.module.js.map