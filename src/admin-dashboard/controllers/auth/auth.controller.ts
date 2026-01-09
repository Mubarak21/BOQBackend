import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
  Inject,
  Res,
} from "@nestjs/common";
import { AuthService } from "../../../auth/auth.service";
import { LoginDto } from "../../../auth/dto/login.dto";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { User } from "../../../entities/user.entity";
import { Public } from "../../../auth/decorators/public.decorator";
import { Admin } from "../../../entities/admin.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { LocalAuthGuard } from "../../../auth/guards/local-auth.guard";
import { JwtService } from "@nestjs/jwt";
import { Response } from "express";
import { AdminRegisterDto } from "../../dto/admin-register.dto";
import { AdminService } from "../../services/admin.service";

@Controller("consultant/auth")
// Removed class-level guards and roles
export class AdminAuthController {
  constructor(
    private readonly authService: AuthService,
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    private readonly jwtService: JwtService,
    private readonly adminService: AdminService
  ) {}

  @Post("register")
  @Public()
  async register(@Body() createAdminDto: AdminRegisterDto) {
    console.log("Admin registration payload:", createAdminDto);

    try {
      const admin = await this.adminService.createAdmin({
        email: createAdminDto.email,
        password: createAdminDto.password,
        display_name: createAdminDto.display_name,
      });

      console.log("Admin created successfully:", admin.email);

      return {
        success: true,
        admin: {
          id: admin.id,
          email: admin.email,
          display_name: admin.display_name,
          role: "admin",
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        "Failed to create admin account",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post("login")
  @Public()
  @UseGuards(LocalAuthGuard)
  async login(@Request() req, @Res({ passthrough: true }) res: Response) {
    const admin = req.user;
    const payload = {
      sub: admin.id,
      email: admin.email,
      role: "admin",
      type: "admin", // Distinguish admin tokens from user tokens
    };
    const token = this.jwtService.sign(payload);
    res.cookie("auth_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 2 * 60 * 60 * 1000, // 2 hours
    });
    const response = {
      success: true,
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        display_name: admin.display_name,
        role: "admin",
      },
    };
    console.log("Admin login successful:", admin.email);
    return response;
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  async logout(@Request() req) {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      throw new HttpException("No token provided", HttpStatus.BAD_REQUEST);
    }
    await this.authService.logout(token);
    return { message: "Logged out successfully" };
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  async getMe(@Request() req) {
    const admin = req.user;
    return {
      id: admin.id,
      email: admin.email,
      display_name: admin.display_name,
      role: "admin",
      type: "admin",
    };
  }

  // Admin management endpoints
  @Get("admins")
  @UseGuards(JwtAuthGuard)
  async getAllAdmins() {
    const admins = await this.adminService.getAllAdmins();
    return {
      success: true,
      admins: admins.map((admin) => ({
        id: admin.id,
        email: admin.email,
        display_name: admin.display_name,
        status: admin.status,
        created_at: admin.created_at,
      })),
    };
  }

  @Get("system-stats")
  @UseGuards(JwtAuthGuard)
  async getSystemStats() {
    return this.adminService.getSystemStats();
  }

  @Post("validate-permissions")
  @UseGuards(JwtAuthGuard)
  async validatePermissions(@Request() req) {
    const isValid = await this.adminService.validateAdminPermissions(
      req.user.id
    );
    return {
      success: isValid,
      message: isValid
        ? "Admin permissions valid"
        : "Admin permissions invalid",
    };
  }
}
