"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VisitorsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const visitor_entity_1 = require("../entities/visitor.entity");
const project_entity_1 = require("../entities/project.entity");
const auth_module_1 = require("../auth/auth.module");
const visitors_controller_1 = require("./visitors.controller");
const visitors_service_1 = require("./visitors.service");
let VisitorsModule = class VisitorsModule {
};
exports.VisitorsModule = VisitorsModule;
exports.VisitorsModule = VisitorsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([visitor_entity_1.Visitor, project_entity_1.Project]),
            auth_module_1.AuthModule,
        ],
        controllers: [visitors_controller_1.VisitorsController],
        providers: [visitors_service_1.VisitorsService],
        exports: [visitors_service_1.VisitorsService],
    })
], VisitorsModule);
//# sourceMappingURL=visitors.module.js.map