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
exports.PenaltiesController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const penalties_service_1 = require("./penalties.service");
const create_penalty_dto_1 = require("./dto/create-penalty.dto");
const appeal_penalty_dto_1 = require("./dto/appeal-penalty.dto");
let PenaltiesController = class PenaltiesController {
    constructor(penaltiesService) {
        this.penaltiesService = penaltiesService;
    }
    create(createPenaltyDto, req) {
        return this.penaltiesService.create(createPenaltyDto, req.user);
    }
    findByProject(projectId) {
        return this.penaltiesService.findByProject(projectId);
    }
    findOne(id) {
        return this.penaltiesService.findOne(id);
    }
    appeal(id, appealDto, req) {
        return this.penaltiesService.appeal(id, appealDto, req.user);
    }
    markAsPaid(id, req) {
        return this.penaltiesService.markAsPaid(id, req.user);
    }
};
exports.PenaltiesController = PenaltiesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_penalty_dto_1.CreatePenaltyDto, Object]),
    __metadata("design:returntype", void 0)
], PenaltiesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)("project/:projectId"),
    __param(0, (0, common_1.Param)("projectId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PenaltiesController.prototype, "findByProject", null);
__decorate([
    (0, common_1.Get)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PenaltiesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(":id/appeal"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, appeal_penalty_dto_1.AppealPenaltyDto, Object]),
    __metadata("design:returntype", void 0)
], PenaltiesController.prototype, "appeal", null);
__decorate([
    (0, common_1.Post)(":id/mark-paid"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PenaltiesController.prototype, "markAsPaid", null);
exports.PenaltiesController = PenaltiesController = __decorate([
    (0, common_1.Controller)("penalties"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [penalties_service_1.PenaltiesService])
], PenaltiesController);
//# sourceMappingURL=penalties.controller.js.map