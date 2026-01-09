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
const jwt_auth_guard_1 = require("../../../auth/guards/jwt-auth.guard");
const public_decorator_1 = require("../../../auth/decorators/public.decorator");
const admin_entity_1 = require("../../../entities/admin.entity");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const local_auth_guard_1 = require("../../../auth/guards/local-auth.guard");
const jwt_1 = require("@nestjs/jwt");
const admin_register_dto_1 = require("../../dto/admin-register.dto");
const admin_service_1 = require("../../services/admin.service");
let AdminAuthController = class AdminAuthController {
    constructor(authService, adminRepository, jwtService, adminService) {
        this.authService = authService;
        this.adminRepository = adminRepository;
        this.jwtService = jwtService;
        this.adminService = adminService;
    }
    async register(createAdminDto) {
        console.log("Admin registration payload:", createAdminDto);
        try {
            const admin = await this.adminService.createAdmin({
                email: createAdminDto.email,
                password: createAdminDto.password,
                display_name: createAdminDto.display_name,
            });
            console.log("Admin created successfully:", admin.email);
            return {
                success: true,
                admin: {
                    id: admin.id,
                    email: admin.email,
                    display_name: admin.display_name,
                    role: "admin",
                },
            };
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException("Failed to create admin account", common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async login(req, res) {
        const admin = req.user;
        const payload = {
            sub: admin.id,
            email: admin.email,
            role: "admin",
            type: "admin",
        };
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
                role: "admin",
            },
        };
        console.log("Admin login successful:", admin.email);
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
        const admin = req.user;
        return {
            id: admin.id,
            email: admin.email,
            display_name: admin.display_name,
            role: "admin",
            type: "admin",
        };
    }
    async getAllAdmins() {
        const admins = await this.adminService.getAllAdmins();
        return {
            success: true,
            admins: admins.map((admin) => ({
                id: admin.id,
                email: admin.email,
                display_name: admin.display_name,
                status: admin.status,
                created_at: admin.created_at,
            })),
        };
    }
    async getSystemStats() {
        return this.adminService.getSystemStats();
    }
    async validatePermissions(req) {
        const isValid = await this.adminService.validateAdminPermissions(req.user.id);
        return {
            success: isValid,
            message: isValid
                ? "Admin permissions valid"
                : "Admin permissions invalid",
        };
    }
};
exports.AdminAuthController = AdminAuthController;
__decorate([
    (0, common_1.Post)("register"),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_register_dto_1.AdminRegisterDto]),
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
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminAuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Get)("me"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminAuthController.prototype, "getMe", null);
__decorate([
    (0, common_1.Get)("admins"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminAuthController.prototype, "getAllAdmins", null);
__decorate([
    (0, common_1.Get)("system-stats"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminAuthController.prototype, "getSystemStats", null);
__decorate([
    (0, common_1.Post)("validate-permissions"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminAuthController.prototype, "validatePermissions", null);
exports.AdminAuthController = AdminAuthController = __decorate([
    (0, common_1.Controller)("consultant/auth"),
    __param(1, (0, typeorm_1.InjectRepository)(admin_entity_1.Admin)),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        typeorm_2.Repository,
        jwt_1.JwtService,
        admin_service_1.AdminService])
], AdminAuthController);
//# sourceMappingURL=auth.controller.js.map