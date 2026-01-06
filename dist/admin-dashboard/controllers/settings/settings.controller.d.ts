import { AdminService } from "../../services/admin.service";
export declare class AdminSettingsController {
    private readonly adminService;
    constructor(adminService: AdminService);
    getSettings(): Promise<{
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
    updateSettings(settings: any): Promise<{
        success: boolean;
        message: string;
        settings: any;
    }>;
}
