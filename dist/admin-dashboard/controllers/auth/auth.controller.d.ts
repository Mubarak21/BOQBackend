import { AuthService } from "../../../auth/auth.service";
import { Admin } from "../../../entities/admin.entity";
import { Repository } from "typeorm";
import { JwtService } from "@nestjs/jwt";
import { Response } from "express";
export declare class AdminAuthController {
    private readonly authService;
    private readonly adminRepository;
    private readonly jwtService;
    constructor(authService: AuthService, adminRepository: Repository<Admin>, jwtService: JwtService);
    register(createAdminDto: any): Promise<{
        error: string;
        success?: undefined;
        admin?: undefined;
    } | {
        success: boolean;
        admin: {
            id: string;
            email: string;
            display_name: string;
        };
        error?: undefined;
    }>;
    login(req: any, res: Response): Promise<{
        success: boolean;
        token: string;
        admin: {
            id: any;
            email: any;
            display_name: any;
        };
    }>;
    logout(req: any): Promise<{
        message: string;
    }>;
    getMe(req: any): Promise<any>;
}
