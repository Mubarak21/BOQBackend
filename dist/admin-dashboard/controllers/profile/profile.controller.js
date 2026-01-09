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
exports.AdminProfileController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const jwt_auth_guard_1 = require("../../../auth/guards/jwt-auth.guard");
const admin_service_1 = require("../../services/admin.service");
let AdminProfileController = class AdminProfileController {
    constructor(adminService) {
        this.adminService = adminService;
    }
    async updateProfile(profileData, req) {
        const adminId = req.user.id;
        return this.adminService.updateAdminProfile(adminId, profileData);
    }
    async changePassword(passwordData, req) {
        const adminId = req.user.id;
        const { currentPassword, newPassword, confirmPassword } = passwordData;
        if (newPassword !== confirmPassword) {
            throw new common_1.BadRequestException("New passwords do not match");
        }
        return this.adminService.changePassword(adminId, currentPassword, newPassword);
    }
    async uploadAvatar(file, req) {
        if (!file) {
            throw new common_1.BadRequestException("No file uploaded");
        }
        const adminId = req.user.id;
        return this.adminService.uploadAvatar(adminId, file);
    }
};
exports.AdminProfileController = AdminProfileController;
__decorate([
    (0, common_1.Put)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminProfileController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Put)("password"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminProfileController.prototype, "changePassword", null);
__decorate([
    (0, common_1.Post)("avatar"),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)("avatar")),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminProfileController.prototype, "uploadAvatar", null);
exports.AdminProfileController = AdminProfileController = __decorate([
    (0, common_1.Controller)("consultant/profile"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminProfileController);
//# sourceMappingURL=profile.controller.js.map