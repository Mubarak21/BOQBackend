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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const jwt_1 = require("@nestjs/jwt");
const user_entity_1 = require("../entities/user.entity");
const bcrypt = require("bcrypt");
const config_1 = require("@nestjs/config");
let AuthService = class AuthService {
    constructor(userRepository, jwtService, configService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.configService = configService;
        this.tokenBlacklist = new Set();
    }
    async register(createUserDto) {
        const existingUser = await this.userRepository.findOne({
            where: { email: createUserDto.email },
        });
        if (existingUser) {
            throw new common_1.UnauthorizedException("Email already exists");
        }
        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
        const user = this.userRepository.create({
            ...createUserDto,
            password: hashedPassword,
        });
        await this.userRepository.save(user);
        const { password, ...result } = user;
        const [access_token, refresh_token] = await Promise.all([
            this.generateAccessToken(user),
            this.generateRefreshToken(user),
        ]);
        return {
            access_token,
            refresh_token,
            user: result,
        };
    }
    async validateToken(token) {
        try {
            if (this.tokenBlacklist.has(token)) {
                throw new common_1.UnauthorizedException("Token has been invalidated");
            }
            const payload = this.jwtService.verify(token);
            if (payload.exp && payload.exp * 1000 < Date.now()) {
                throw new common_1.UnauthorizedException("Token has expired");
            }
            const user = await this.userRepository.findOne({
                where: { id: payload.sub },
            });
            if (!user) {
                throw new common_1.UnauthorizedException("User not found");
            }
            return user;
        }
        catch (error) {
            if (error instanceof common_1.UnauthorizedException) {
                throw error;
            }
            throw new common_1.UnauthorizedException("Invalid token");
        }
    }
    async login(email, password) {
        const user = await this.userRepository.findOne({
            where: { email },
        });
        if (!user) {
            throw new common_1.UnauthorizedException("Invalid email or password");
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException("Invalid email or password");
        }
        const { password: _, ...result } = user;
        const [access_token, refresh_token] = await Promise.all([
            this.generateAccessToken(user),
            this.generateRefreshToken(user),
        ]);
        return {
            access_token,
            refresh_token,
            user: result,
        };
    }
    async generateAccessToken(user) {
        const payload = {
            sub: user.id,
            email: user.email,
            type: "access",
        };
        return this.jwtService.sign(payload, {
            secret: this.configService.get("JWT_SECRET"),
            expiresIn: this.configService.get("JWT_EXPIRATION", "15m"),
        });
    }
    async generateRefreshToken(user) {
        const payload = {
            sub: user.id,
            email: user.email,
            type: "refresh",
        };
        return this.jwtService.sign(payload, {
            secret: this.configService.get("JWT_REFRESH_SECRET"),
            expiresIn: this.configService.get("JWT_REFRESH_EXPIRATION", "7d"),
        });
    }
    async refreshToken(refresh_token) {
        try {
            const payload = this.jwtService.verify(refresh_token, {
                secret: this.configService.get("JWT_REFRESH_SECRET"),
            });
            if (payload.type !== "refresh") {
                throw new common_1.UnauthorizedException("Invalid token type");
            }
            if (payload.exp && payload.exp * 1000 < Date.now()) {
                throw new common_1.UnauthorizedException("Refresh token has expired");
            }
            const user = await this.userRepository.findOne({
                where: { id: payload.sub },
            });
            if (!user) {
                throw new common_1.UnauthorizedException("User not found");
            }
            const access_token = await this.generateAccessToken(user);
            return { access_token };
        }
        catch (error) {
            if (error instanceof common_1.UnauthorizedException) {
                throw error;
            }
            throw new common_1.UnauthorizedException("Invalid refresh token");
        }
    }
    async logout(token) {
        try {
            const payload = this.jwtService.verify(token);
            this.tokenBlacklist.add(token);
            if (this.tokenBlacklist.size > 1000) {
                this.cleanupBlacklist();
            }
        }
        catch (error) {
            throw new common_1.UnauthorizedException("Invalid token");
        }
    }
    cleanupBlacklist() {
        const now = Date.now();
        for (const token of this.tokenBlacklist) {
            try {
                const payload = this.jwtService.verify(token);
                if (payload.exp * 1000 < now) {
                    this.tokenBlacklist.delete(token);
                }
            }
            catch {
                this.tokenBlacklist.delete(token);
            }
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map