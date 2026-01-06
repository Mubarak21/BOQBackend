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
exports.ComplaintsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const complaints_service_1 = require("./complaints.service");
const create_complaint_dto_1 = require("./dto/create-complaint.dto");
const respond_complaint_dto_1 = require("./dto/respond-complaint.dto");
const appeal_complaint_dto_1 = require("./dto/appeal-complaint.dto");
let ComplaintsController = class ComplaintsController {
    constructor(complaintsService) {
        this.complaintsService = complaintsService;
    }
    create(createComplaintDto, req) {
        return this.complaintsService.create(createComplaintDto, req.user);
    }
    findByProject(projectId) {
        return this.complaintsService.findByProject(projectId);
    }
    findOne(id) {
        return this.complaintsService.findOne(id);
    }
    respond(id, respondDto, req) {
        return this.complaintsService.respond(id, respondDto, req.user);
    }
    appeal(id, appealDto, req) {
        return this.complaintsService.appeal(id, appealDto, req.user);
    }
};
exports.ComplaintsController = ComplaintsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_complaint_dto_1.CreateComplaintDto, Object]),
    __metadata("design:returntype", void 0)
], ComplaintsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)("project/:projectId"),
    __param(0, (0, common_1.Param)("projectId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ComplaintsController.prototype, "findByProject", null);
__decorate([
    (0, common_1.Get)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ComplaintsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(":id/respond"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, respond_complaint_dto_1.RespondComplaintDto, Object]),
    __metadata("design:returntype", void 0)
], ComplaintsController.prototype, "respond", null);
__decorate([
    (0, common_1.Post)(":id/appeal"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, appeal_complaint_dto_1.AppealComplaintDto, Object]),
    __metadata("design:returntype", void 0)
], ComplaintsController.prototype, "appeal", null);
exports.ComplaintsController = ComplaintsController = __decorate([
    (0, common_1.Controller)("complaints"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [complaints_service_1.ComplaintsService])
], ComplaintsController);
//# sourceMappingURL=complaints.controller.js.map