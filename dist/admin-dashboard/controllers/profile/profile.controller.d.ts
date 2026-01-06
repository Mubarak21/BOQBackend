import { AdminService } from "../../services/admin.service";
export declare class AdminProfileController {
    private readonly adminService;
    constructor(adminService: AdminService);
    updateProfile(profileData: any, req: any): Promise<import("../../../entities/admin.entity").Admin>;
    changePassword(passwordData: any, req: any): Promise<{
        success: boolean;
        message: string;
    }>;
    uploadAvatar(file: Express.Multer.File, req: any): Promise<{
        avatarUrl: string;
    }>;
}
