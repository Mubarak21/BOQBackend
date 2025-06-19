import { Repository } from "typeorm";
import { JwtService } from "@nestjs/jwt";
import { User } from "../entities/user.entity";
import { CreateUserDto } from "./dto/create-user.dto";
import { ConfigService } from "@nestjs/config";
export declare class AuthService {
    private userRepository;
    private jwtService;
    private configService;
    private readonly tokenBlacklist;
    constructor(userRepository: Repository<User>, jwtService: JwtService, configService: ConfigService);
    register(createUserDto: CreateUserDto): Promise<{
        access_token: string;
        refresh_token: string;
        user: Omit<User, "password">;
    }>;
    validateToken(token: string): Promise<User>;
    login(email: string, password: string): Promise<{
        access_token: string;
        refresh_token: string;
        user: Omit<User, "password">;
    }>;
    private generateAccessToken;
    private generateRefreshToken;
    refreshToken(refresh_token: string): Promise<{
        access_token: string;
    }>;
    logout(token: string): Promise<void>;
    private cleanupBlacklist;
}
