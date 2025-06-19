import { AuthService } from "./auth.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { LoginDto } from "./dto/login.dto";
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(createUserDto: CreateUserDto): Promise<{
        access_token: string;
        refresh_token: string;
        user: Omit<import("../entities/user.entity").User, "password">;
    }>;
    login(loginDto: LoginDto): Promise<{
        access_token: string;
        refresh_token: string;
        user: Omit<import("../entities/user.entity").User, "password">;
    }>;
    refreshToken(refreshToken: string): Promise<{
        access_token: string;
    }>;
    logout(authHeader: string): Promise<{
        message: string;
    }>;
}
