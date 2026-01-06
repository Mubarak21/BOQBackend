import { AuthService } from "../../../auth/auth.service";
import { Admin } from "../../../entities/admin.entity";
import { Repository } from "typeorm";
import { JwtService } from "@nestjs/jwt";
import { Response } from "express";
import { AdminRegisterDto } from "../../dto/admin-register.dto";
import { AdminService } from "../../services/admin.service";
export declare class AdminAuthController {
    private readonly authService;
    private readonly adminRepository;
    private readonly jwtService;
    private readonly adminService;
    constructor(authService: AuthService, adminRepository: Repository<Admin>, jwtService: JwtService, adminService: AdminService);
    register(createAdminDto: AdminRegisterDto): Promise<{
        success: boolean;
        admin: {
            id: string;
            email: string;
            display_name: string;
            role: string;
        };
    }>;
    login(req: any, res: Response): Promise<{
        success: boolean;
        token: string;
        admin: {
            id: any;
            email: any;
            display_name: any;
            role: string;
        };
    }>;
    logout(req: any): Promise<{
        message: string;
    }>;
    getMe(req: any): Promise<{
        id: any;
        email: any;
        display_name: any;
        role: string;
        type: string;
    }>;
    getAllAdmins(): Promise<{
        success: boolean;
        admins: {
            id: string;
            email: string;
            display_name: string;
            status: string;
            created_at: Date;
        }[];
    }>;
    getSystemStats(): Promise<{
        totalUsers: number;
        totalProjects: number;
        totalActivities: number;
        totalAdmins: number;
        systemHealth: string;
        lastUpdated: string;
    }>;
    validatePermissions(req: any): Promise<{
        success: boolean;
        message: string;
    }>;
}
