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
var JwtAuthGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const auth_service_1 = require("../auth.service");
const public_decorator_1 = require("../decorators/public.decorator");
const passport_1 = require("@nestjs/passport");
let JwtAuthGuard = JwtAuthGuard_1 = class JwtAuthGuard extends (0, passport_1.AuthGuard)("jwt") {
    constructor(reflector, authService) {
        super();
        this.reflector = reflector;
        this.authService = authService;
        this.logger = new common_1.Logger(JwtAuthGuard_1.name);
    }
    async canActivate(context) {
        const isPublic = this.reflector.getAllAndOverride(public_decorator_1.IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        let token = null;
        const authHeader = request.headers.authorization;
        if (authHeader) {
            token = authHeader.split(" ")[1];
        }
        else if (request.cookies && request.cookies.auth_token) {
            token = request.cookies.auth_token;
            this.logger.debug("Using token from cookie");
        }
        if (!token) {
            this.logger.warn("No authorization header or auth_token cookie provided");
            throw new common_1.UnauthorizedException("No authorization header or auth_token cookie provided");
        }
        try {
            const user = await this.authService.validateToken(token);
            if (!user) {
                this.logger.warn("Invalid token or user not found");
                throw new common_1.UnauthorizedException("Invalid token or user not found");
            }
            request.user = user;
            if (user && "role" in user && user.role === "consultant") {
                request.isConsultant = true;
            }
            else {
                request.isConsultant = false;
            }
            return true;
        }
        catch (error) {
            this.logger.error("Token validation failed", error);
            throw new common_1.UnauthorizedException("Invalid token");
        }
    }
};
exports.JwtAuthGuard = JwtAuthGuard;
exports.JwtAuthGuard = JwtAuthGuard = JwtAuthGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        auth_service_1.AuthService])
], JwtAuthGuard);
//# sourceMappingURL=jwt-auth.guard.js.map