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
exports.VisitorsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const visitors_service_1 = require("./visitors.service");
const create_visitor_dto_1 = require("./dto/create-visitor.dto");
const update_visitor_dto_1 = require("./dto/update-visitor.dto");
let VisitorsController = class VisitorsController {
    constructor(visitorsService) {
        this.visitorsService = visitorsService;
    }
    create(projectId, dto, req) {
        return this.visitorsService.create(projectId, dto, req.user);
    }
    findByProject(projectId, req) {
        return this.visitorsService.findByProject(projectId, req.user);
    }
    findOne(id, req) {
        return this.visitorsService.findOne(id, req.user);
    }
    update(id, dto, req) {
        return this.visitorsService.update(id, dto, req.user);
    }
    async remove(id, req) {
        await this.visitorsService.remove(id, req.user);
        return { message: "Visitor record removed" };
    }
};
exports.VisitorsController = VisitorsController;
__decorate([
    (0, common_1.Post)("project/:projectId"),
    __param(0, (0, common_1.Param)("projectId")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_visitor_dto_1.CreateVisitorDto, Object]),
    __metadata("design:returntype", void 0)
], VisitorsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)("project/:projectId"),
    __param(0, (0, common_1.Param)("projectId")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], VisitorsController.prototype, "findByProject", null);
__decorate([
    (0, common_1.Get)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], VisitorsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_visitor_dto_1.UpdateVisitorDto, Object]),
    __metadata("design:returntype", void 0)
], VisitorsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], VisitorsController.prototype, "remove", null);
exports.VisitorsController = VisitorsController = __decorate([
    (0, common_1.Controller)("visitors"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [visitors_service_1.VisitorsService])
], VisitorsController);
//# sourceMappingURL=visitors.controller.js.map