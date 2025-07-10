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
exports.AdminAuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("../../../auth/auth.service");
const roles_guard_1 = require("../../../auth/guards/roles.guard");
const roles_decorator_1 = require("../../../auth/decorators/roles.decorator");
const user_entity_1 = require("../../../entities/user.entity");
const public_decorator_1 = require("../../../auth/decorators/public.decorator");
const admin_entity_1 = require("../../../entities/admin.entity");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const local_auth_guard_1 = require("../../../auth/guards/local-auth.guard");
const jwt_1 = require("@nestjs/jwt");
let AdminAuthController = class AdminAuthController {
    constructor(authService, adminRepository, jwtService) {
        this.authService = authService;
        this.adminRepository = adminRepository;
        this.jwtService = jwtService;
    }
    async register(createAdminDto) {
        console.log("Admin registration payload:", createAdminDto);
        if (!createAdminDto.display_name ||
            createAdminDto.display_name.trim() === "") {
            createAdminDto.display_name = "Admin";
        }
        console.log("Final display_name:", createAdminDto.display_name);
        const existingAdmin = await this.adminRepository.findOne({ where: {} });
        if (existingAdmin) {
            return {
                error: "Admin registration is closed. An admin already exists.",
            };
        }
        const admin = this.adminRepository.create({
            email: createAdminDto.email,
            password: await this.authService.hashPassword(createAdminDto.password),
            display_name: createAdminDto.display_name,
            status: "active",
        });
        await this.adminRepository.save(admin);
        return {
            success: true,
            admin: {
                id: admin.id,
                email: admin.email,
                display_name: admin.display_name,
            },
        };
    }
    async login(req, res) {
        const admin = req.user;
        const payload = { sub: admin.id, email: admin.email, role: "admin" };
        const token = this.jwtService.sign(payload);
        res.cookie("auth_token", token, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            maxAge: 2 * 60 * 60 * 1000,
        });
        const response = {
            success: true,
            token,
            admin: {
                id: admin.id,
                email: admin.email,
                display_name: admin.display_name,
            },
        };
        console.log("Login response sent to frontend:", response);
        return response;
    }
    async logout(req) {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            throw new common_1.HttpException("No token provided", common_1.HttpStatus.BAD_REQUEST);
        }
        await this.authService.logout(token);
        return { message: "Logged out successfully" };
    }
    async getMe(req) {
        return req.user;
    }
};
exports.AdminAuthController = AdminAuthController;
__decorate([
    (0, common_1.Post)("register"),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminAuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)("login"),
    (0, public_decorator_1.Public)(),
    (0, common_1.UseGuards)(local_auth_guard_1.LocalAuthGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminAuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)("logout"),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminAuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Get)("me"),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminAuthController.prototype, "getMe", null);
exports.AdminAuthController = AdminAuthController = __decorate([
    (0, common_1.Controller)("admin/auth"),
    __param(1, (0, typeorm_1.InjectRepository)(admin_entity_1.Admin)),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        typeorm_2.Repository,
        jwt_1.JwtService])
], AdminAuthController);
//# sourceMappingURL=auth.controller.js.map