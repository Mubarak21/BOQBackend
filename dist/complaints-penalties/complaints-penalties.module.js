"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplaintsPenaltiesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const complaint_entity_1 = require("../entities/complaint.entity");
const penalty_entity_1 = require("../entities/penalty.entity");
const project_entity_1 = require("../entities/project.entity");
const complaints_controller_1 = require("./complaints.controller");
const penalties_controller_1 = require("./penalties.controller");
const complaints_service_1 = require("./complaints.service");
const penalties_service_1 = require("./penalties.service");
const auth_module_1 = require("../auth/auth.module");
let ComplaintsPenaltiesModule = class ComplaintsPenaltiesModule {
};
exports.ComplaintsPenaltiesModule = ComplaintsPenaltiesModule;
exports.ComplaintsPenaltiesModule = ComplaintsPenaltiesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([complaint_entity_1.Complaint, penalty_entity_1.Penalty, project_entity_1.Project]),
            auth_module_1.AuthModule,
        ],
        controllers: [complaints_controller_1.ComplaintsController, penalties_controller_1.PenaltiesController],
        providers: [complaints_service_1.ComplaintsService, penalties_service_1.PenaltiesService],
        exports: [complaints_service_1.ComplaintsService, penalties_service_1.PenaltiesService],
    })
], ComplaintsPenaltiesModule);
//# sourceMappingURL=complaints-penalties.module.js.map