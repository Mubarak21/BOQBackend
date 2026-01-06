import { Repository } from "typeorm";
import { Admin } from "../../entities/admin.entity";
import { User } from "../../entities/user.entity";
import { Project } from "../../entities/project.entity";
import { Activity } from "../../entities/activity.entity";
export declare class AdminService {
    private readonly adminRepository;
    private readonly userRepository;
    private readonly projectRepository;
    private readonly activityRepository;
    constructor(adminRepository: Repository<Admin>, userRepository: Repository<User>, projectRepository: Repository<Project>, activityRepository: Repository<Activity>);
    createAdmin(adminData: {
        email: string;
        password: string;
        display_name?: string;
    }): Promise<Admin>;
    findAdminByEmail(email: string): Promise<Admin | null>;
    findAdminById(id: string): Promise<Admin | null>;
    getAllAdmins(): Promise<Admin[]>;
    updateAdmin(id: string, updateData: Partial<Admin>): Promise<Admin>;
    deleteAdmin(id: string): Promise<void>;
    getSystemStats(): Promise<{
        totalUsers: number;
        totalProjects: number;
        totalActivities: number;
        totalAdmins: number;
        systemHealth: string;
        lastUpdated: string;
    }>;
    validateAdminPermissions(adminId: string): Promise<boolean>;
    getSystemSettings(): Promise<{
        general: {
            siteName: string;
            siteDescription: string;
            timezone: string;
            language: string;
            dateFormat: string;
            timeFormat: string;
        };
        security: {
            sessionTimeout: number;
            maxLoginAttempts: number;
            requireTwoFactor: boolean;
            passwordMinLength: number;
            passwordRequireSpecial: boolean;
            passwordRequireNumbers: boolean;
            passwordRequireUppercase: boolean;
        };
        notifications: {
            emailNotifications: boolean;
            pushNotifications: boolean;
            smsNotifications: boolean;
            weeklyDigest: boolean;
            monthlyReport: boolean;
            systemAlerts: boolean;
        };
        appearance: {
            theme: string;
            primaryColor: string;
            sidebarCollapsed: boolean;
            showAvatars: boolean;
            showNotifications: boolean;
        };
        integrations: {
            enableGoogleAuth: boolean;
            enableGithubAuth: boolean;
            enableSlackIntegration: boolean;
            enableEmailIntegration: boolean;
        };
    }>;
    updateSystemSettings(settings: any): Promise<{
        success: boolean;
        message: string;
        settings: any;
    }>;
    updateAdminProfile(adminId: string, profileData: any): Promise<Admin>;
    changePassword(adminId: string, currentPassword: string, newPassword: string): Promise<{
        success: boolean;
        message: string;
    }>;
    uploadAvatar(adminId: string, file: Express.Multer.File): Promise<{
        avatarUrl: string;
    }>;
}
