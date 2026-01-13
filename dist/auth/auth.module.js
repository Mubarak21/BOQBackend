"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const auth_service_1 = require("./auth.service");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
const rate_limit_guard_1 = require("./guards/rate-limit.guard");
const user_entity_1 = require("../entities/user.entity");
const auth_controller_1 = require("./auth.controller");
const department_entity_1 = require("../entities/department.entity");
const roles_guard_1 = require("./guards/roles.guard");
const local_strategy_1 = require("./strategies/local.strategy");
const admin_entity_1 = require("../entities/admin.entity");
const collaboration_request_entity_1 = require("../entities/collaboration-request.entity");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                useFactory: async (configService) => ({
                    secret: configService.get("JWT_SECRET"),
                    signOptions: {
                        expiresIn: configService.get("JWT_EXPIRATION", "15m"),
                    },
                }),
                inject: [config_1.ConfigService],
            }),
            typeorm_1.TypeOrmModule.forFeature([user_entity_1.User, department_entity_1.Department, admin_entity_1.Admin, collaboration_request_entity_1.CollaborationRequest]),
        ],
        controllers: [auth_controller_1.AuthController],
        providers: [
            auth_service_1.AuthService,
            jwt_auth_guard_1.JwtAuthGuard,
            rate_limit_guard_1.RateLimitGuard,
            roles_guard_1.RolesGuard,
            local_strategy_1.LocalStrategy,
            {
                provide: "JWT_REFRESH_SECRET",
                useFactory: (configService) => configService.get("JWT_REFRESH_SECRET"),
                inject: [config_1.ConfigService],
            },
        ],
        exports: [
            auth_service_1.AuthService,
            jwt_auth_guard_1.JwtAuthGuard,
            rate_limit_guard_1.RateLimitGuard,
            jwt_1.JwtModule,
        ],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map