import { Controller, Get, Put, Body, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { AdminService } from "../../services/admin.service";

@Controller("consultant/settings")
@UseGuards(JwtAuthGuard)
export class AdminSettingsController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  async getSettings() {
    return this.adminService.getSystemSettings();
  }

  @Put()
  async updateSettings(@Body() settings: any) {
    return this.adminService.updateSystemSettings(settings);
  }
}
