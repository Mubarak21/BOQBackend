import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { RateLimitGuard } from "./guards/rate-limit.guard";
import { User } from "../entities/user.entity";
import { AuthController } from "./auth.controller";
import { Department } from "../entities/department.entity";
import { RolesGuard } from "./guards/roles.guard";
import { LocalStrategy } from "./strategies/local.strategy";
import { Admin } from "../entities/admin.entity";

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_SECRET"),
        signOptions: {
          expiresIn: configService.get<string>("JWT_EXPIRATION", "15m"),
        },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([User, Department, Admin]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtAuthGuard,
    RateLimitGuard,
    RolesGuard,
    LocalStrategy, // Register the local strategy
    {
      provide: "JWT_REFRESH_SECRET",
      useFactory: (configService: ConfigService) =>
        configService.get<string>("JWT_REFRESH_SECRET"),
      inject: [ConfigService],
    },
  ],
  exports: [
    AuthService,
    JwtAuthGuard,
    RateLimitGuard,
    JwtModule, // Export JwtModule so JwtService is available to other modules
  ],
})
export class AuthModule {}
