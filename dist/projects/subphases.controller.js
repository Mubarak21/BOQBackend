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
let SubPhasesController = class SubPhasesController {
    constructor(subPhasesService) {
        this.subPhasesService = subPhasesService;
    }
    async updateSubPhase(id, isCompleted, req) {
        const updated = await this.subPhasesService.update(id, { isCompleted }, req.user);
        if (!updated)
            throw new common_1.NotFoundException("SubPhase not found");
        return updated;
    }
};
exports.SubPhasesController = SubPhasesController;
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
exports.SubPhasesController = SubPhasesController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)("subphases"),
    __metadata("design:paramtypes", [subphases_service_1.SubPhasesService])
], SubPhasesController);
//# sourceMappingURL=subphases.controller.js.map