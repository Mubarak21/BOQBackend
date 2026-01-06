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
exports.SubPhasesController = void 0;
const common_1 = require("@nestjs/common");
const subphases_service_1 = require("./subphases.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const create_sub_phase_dto_1 = require("./dto/create-sub-phase.dto");
let SubPhasesController = class SubPhasesController {
    constructor(subPhasesService) {
        this.subPhasesService = subPhasesService;
    }
    async createSubPhase(phaseId, createDto, req) {
        return await this.subPhasesService.create(phaseId, createDto, req.user);
    }
    async createNestedSubPhase(parentSubPhaseId, createDto, req) {
        const parentSubPhase = await this.subPhasesService.findOne(parentSubPhaseId);
        if (!parentSubPhase) {
            throw new common_1.NotFoundException("Parent sub-phase not found");
        }
        return await this.subPhasesService.create(parentSubPhase.phase_id, { ...createDto, parentSubPhaseId }, req.user);
    }
    async updateSubPhase(id, isCompleted, req) {
        const updated = await this.subPhasesService.update(id, { isCompleted }, req.user);
        if (!updated)
            throw new common_1.NotFoundException("SubPhase not found");
        return updated;
    }
    async searchSubPhases(projectId, search, req) {
        if (!projectId) {
            throw new common_1.NotFoundException("projectId query parameter is required");
        }
        if (!search || search.trim().length === 0) {
            return [];
        }
        return this.subPhasesService.searchSubPhases(projectId, search);
    }
};
exports.SubPhasesController = SubPhasesController;
__decorate([
    (0, common_1.Post)("phase/:phaseId"),
    (0, common_1.HttpCode)(201),
    __param(0, (0, common_1.Param)("phaseId")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_sub_phase_dto_1.CreateSubPhaseDto, Object]),
    __metadata("design:returntype", Promise)
], SubPhasesController.prototype, "createSubPhase", null);
__decorate([
    (0, common_1.Post)("subphase/:parentSubPhaseId"),
    (0, common_1.HttpCode)(201),
    __param(0, (0, common_1.Param)("parentSubPhaseId")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_sub_phase_dto_1.CreateSubPhaseDto, Object]),
    __metadata("design:returntype", Promise)
], SubPhasesController.prototype, "createNestedSubPhase", null);
__decorate([
    (0, common_1.Patch)(":id"),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)("isCompleted")),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean, Object]),
    __metadata("design:returntype", Promise)
], SubPhasesController.prototype, "updateSubPhase", null);
__decorate([
    (0, common_1.Get)("search"),
    __param(0, (0, common_1.Query)("projectId")),
    __param(1, (0, common_1.Query)("search")),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], SubPhasesController.prototype, "searchSubPhases", null);
exports.SubPhasesController = SubPhasesController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)("subphases"),
    __metadata("design:paramtypes", [subphases_service_1.SubPhasesService])
], SubPhasesController);
//# sourceMappingURL=subphases.controller.js.map