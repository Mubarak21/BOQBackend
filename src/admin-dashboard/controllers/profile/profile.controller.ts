import {
  Controller,
  Put,
  Post,
  Body,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { AdminService } from "../../services/admin.service";

@Controller("consultant/profile")
@UseGuards(JwtAuthGuard)
export class AdminProfileController {
  constructor(private readonly adminService: AdminService) {}

  @Put()
  async updateProfile(@Body() profileData: any, @Request() req: any) {
    const adminId = req.user.id;
    return this.adminService.updateAdminProfile(adminId, profileData);
  }

  @Put("password")
  async changePassword(@Body() passwordData: any, @Request() req: any) {
    const adminId = req.user.id;
    const { currentPassword, newPassword, confirmPassword } = passwordData;

    if (newPassword !== confirmPassword) {
      throw new BadRequestException("New passwords do not match");
    }

    return this.adminService.changePassword(
      adminId,
      currentPassword,
      newPassword
    );
  }

  @Post("avatar")
  @UseInterceptors(FileInterceptor("avatar"))
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any
  ) {
    if (!file) {
      throw new BadRequestException("No file uploaded");
    }

    const adminId = req.user.id;
    return this.adminService.uploadAvatar(adminId, file);
  }
}
