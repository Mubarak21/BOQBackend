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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const admin_entity_1 = require("../../entities/admin.entity");
const user_entity_1 = require("../../entities/user.entity");
const project_entity_1 = require("../../entities/project.entity");
const activity_entity_1 = require("../../entities/activity.entity");
const bcrypt = require("bcrypt");
let AdminService = class AdminService {
    constructor(adminRepository, userRepository, projectRepository, activityRepository) {
        this.adminRepository = adminRepository;
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
        this.activityRepository = activityRepository;
    }
    async createAdmin(adminData) {
        const existingAdmin = await this.adminRepository.findOne({
            where: { email: adminData.email },
        });
        if (existingAdmin) {
            throw new common_1.HttpException("Admin with this email already exists", common_1.HttpStatus.CONFLICT);
        }
        const hashedPassword = await bcrypt.hash(adminData.password, 10);
        const admin = this.adminRepository.create({
            email: adminData.email,
            password: hashedPassword,
            display_name: adminData.display_name || "Admin",
            status: "active",
        });
        return this.adminRepository.save(admin);
    }
    async findAdminByEmail(email) {
        return this.adminRepository.findOne({ where: { email } });
    }
    async findAdminById(id) {
        return this.adminRepository.findOne({ where: { id } });
    }
    async getAllAdmins() {
        return this.adminRepository.find({
            select: ["id", "email", "display_name", "status", "created_at"],
        });
    }
    async updateAdmin(id, updateData) {
        const admin = await this.findAdminById(id);
        if (!admin) {
            throw new common_1.HttpException("Admin not found", common_1.HttpStatus.NOT_FOUND);
        }
        if (updateData.password) {
            updateData.password = await bcrypt.hash(updateData.password, 10);
        }
        Object.assign(admin, updateData);
        return this.adminRepository.save(admin);
    }
    async deleteAdmin(id) {
        const admin = await this.findAdminById(id);
        if (!admin) {
            throw new common_1.HttpException("Admin not found", common_1.HttpStatus.NOT_FOUND);
        }
        await this.adminRepository.remove(admin);
    }
    async getSystemStats() {
        const [totalUsers, totalProjects, totalActivities, totalAdmins] = await Promise.all([
            this.userRepository.count(),
            this.projectRepository.count(),
            this.activityRepository.count(),
            this.adminRepository.count(),
        ]);
        return {
            totalUsers,
            totalProjects,
            totalActivities,
            totalAdmins,
            systemHealth: "operational",
            lastUpdated: new Date().toISOString(),
        };
    }
    async validateAdminPermissions(adminId) {
        const admin = await this.findAdminById(adminId);
        return admin !== null && admin.status === "active";
    }
    async getSystemSettings() {
        return {
            general: {
                siteName: "Admin Portal",
                siteDescription: "Project management system",
                timezone: "UTC",
                language: "en",
                dateFormat: "MM/DD/YYYY",
                timeFormat: "12h",
            },
            security: {
                sessionTimeout: 30,
                maxLoginAttempts: 5,
                requireTwoFactor: false,
                passwordMinLength: 8,
                passwordRequireSpecial: false,
                passwordRequireNumbers: false,
                passwordRequireUppercase: false,
            },
            notifications: {
                emailNotifications: true,
                pushNotifications: false,
                smsNotifications: false,
                weeklyDigest: true,
                monthlyReport: true,
                systemAlerts: true,
            },
            appearance: {
                theme: "light",
                primaryColor: "#3B82F6",
                sidebarCollapsed: false,
                showAvatars: true,
                showNotifications: true,
            },
            integrations: {
                enableGoogleAuth: false,
                enableGithubAuth: false,
                enableSlackIntegration: false,
                enableEmailIntegration: true,
            },
        };
    }
    async updateSystemSettings(settings) {
        return {
            success: true,
            message: "Settings updated successfully",
            settings,
        };
    }
    async updateAdminProfile(adminId, profileData) {
        const admin = await this.findAdminById(adminId);
        if (!admin) {
            throw new common_1.HttpException("Admin not found", common_1.HttpStatus.NOT_FOUND);
        }
        const allowedFields = [
            "display_name",
            "firstName",
            "lastName",
            "phone",
            "department",
            "title",
            "bio",
            "location",
            "timezone",
            "language",
            "socialLinks",
            "skills",
            "preferences",
            "notifications",
        ];
        for (const field of allowedFields) {
            if (profileData[field] !== undefined) {
                admin[field] = profileData[field];
            }
        }
        return this.adminRepository.save(admin);
    }
    async changePassword(adminId, currentPassword, newPassword) {
        const admin = await this.findAdminById(adminId);
        if (!admin) {
            throw new common_1.HttpException("Admin not found", common_1.HttpStatus.NOT_FOUND);
        }
        const isPasswordValid = await bcrypt.compare(currentPassword, admin.password);
        if (!isPasswordValid) {
            throw new common_1.HttpException("Current password is incorrect", common_1.HttpStatus.BAD_REQUEST);
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        admin.password = hashedPassword;
        await this.adminRepository.save(admin);
        return { success: true, message: "Password changed successfully" };
    }
    async uploadAvatar(adminId, file) {
        const admin = await this.findAdminById(adminId);
        if (!admin) {
            throw new common_1.HttpException("Admin not found", common_1.HttpStatus.NOT_FOUND);
        }
        const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${adminId}`;
        admin.avatarUrl = avatarUrl;
        await this.adminRepository.save(admin);
        return { avatarUrl };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(admin_entity_1.Admin)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(2, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __param(3, (0, typeorm_1.InjectRepository)(activity_entity_1.Activity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AdminService);
//# sourceMappingURL=admin.service.js.map