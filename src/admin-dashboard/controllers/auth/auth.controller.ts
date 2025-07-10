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
import { RolesGuard } from "../../../auth/guards/roles.guard";
import { Roles } from "../../../auth/decorators/roles.decorator";
import { UserRole } from "../../../entities/user.entity";
import { User } from "../../../entities/user.entity";
import { Public } from "../../../auth/decorators/public.decorator";
import { Admin } from "../../../entities/admin.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { LocalAuthGuard } from "../../../auth/guards/local-auth.guard";
import { JwtService } from "@nestjs/jwt";
import { Response } from "express";

@Controller("admin/auth")
// Removed class-level guards and roles
export class AdminAuthController {
  constructor(
    private readonly authService: AuthService,
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    private readonly jwtService: JwtService
  ) {}

  @Post("register")
  @Public()
  async register(@Body() createAdminDto: any) {
    console.log("Admin registration payload:", createAdminDto);
    if (
      !createAdminDto.display_name ||
      createAdminDto.display_name.trim() === ""
    ) {
      createAdminDto.display_name = "Admin";
    }
    console.log("Final display_name:", createAdminDto.display_name);
    // Check if any admin exists
    const existingAdmin = await this.adminRepository.findOne({ where: {} });
    if (existingAdmin) {
      return {
        error: "Admin registration is closed. An admin already exists.",
      };
    }
    // Hash password, set fields
    const admin = this.adminRepository.create({
      email: createAdminDto.email,
      password: await this.authService.hashPassword(createAdminDto.password),
      display_name: createAdminDto.display_name,
      status: "active",
    });
    await this.adminRepository.save(admin);
    return {
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        display_name: admin.display_name,
      },
    };
  }

  @Post("login")
  @Public()
  @UseGuards(LocalAuthGuard)
  async login(@Request() req, @Res({ passthrough: true }) res: Response) {
    const admin = req.user;
    const payload = { sub: admin.id, email: admin.email, role: "admin" };
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
      },
    };
    console.log("Login response sent to frontend:", response);
    return response;
  }

  @Post("logout")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async logout(@Request() req) {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      throw new HttpException("No token provided", HttpStatus.BAD_REQUEST);
    }
    await this.authService.logout(token);
    return { message: "Logged out successfully" };
  }

  @Get("me")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getMe(@Request() req) {
    return req.user;
  }

  // Placeholder for password reset and user roles/permissions endpoints
}
