"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccidentsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const accidents_service_1 = require("./accidents.service");
const create_accident_dto_1 = require("./dto/create-accident.dto");
const update_accident_dto_1 = require("./dto/update-accident.dto");
let AccidentsController = class AccidentsController {
    constructor(accidentsService) {
        this.accidentsService = accidentsService;
    }
    create(projectId, dto, req) {
        return this.accidentsService.create(projectId, dto, req.user);
    }
    findByProject(projectId, req) {
        return this.accidentsService.findByProject(projectId, req.user);
    }
    findOne(id, req) {
        return this.accidentsService.findOne(id, req.user);
    }
    update(id, dto, req) {
        return this.accidentsService.update(id, dto, req.user);
    }
};
exports.AccidentsController = AccidentsController;
__decorate([
    (0, common_1.Post)("project/:projectId"),
    __param(0, (0, common_1.Param)("projectId")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_accident_dto_1.CreateAccidentDto, Object]),
    __metadata("design:returntype", void 0)
], AccidentsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)("project/:projectId"),
    __param(0, (0, common_1.Param)("projectId")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AccidentsController.prototype, "findByProject", null);
__decorate([
    (0, common_1.Get)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AccidentsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_accident_dto_1.UpdateAccidentDto, Object]),
    __metadata("design:returntype", void 0)
], AccidentsController.prototype, "update", null);
exports.AccidentsController = AccidentsController = __decorate([
    (0, common_1.Controller)("accidents"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [accidents_service_1.AccidentsService])
], AccidentsController);
//# sourceMappingURL=accidents.controller.js.map