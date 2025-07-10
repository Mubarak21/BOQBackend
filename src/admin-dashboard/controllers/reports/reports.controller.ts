import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  Res,
  UseGuards,
} from "@nestjs/common";
import { ReportsService } from "../../../reports/reports.service";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../../auth/guards/roles.guard";
import { Roles } from "../../../auth/decorators/roles.decorator";
import { UserRole } from "../../../entities/user.entity";
import { Response } from "express";

@Controller("admin/reports")
@UseGuards(JwtAuthGuard)
export class AdminReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // 1. List of available/generated reports
  @Get()
  async listReports(
    @Query("type") type?: string,
    @Query("status") status?: string,
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 20
  ) {
    return this.reportsService.adminList({ type, status, page, limit });
  }

  // 2. Generate a new report
  @Post()
  async generateReport(@Body() body) {
    return this.reportsService.adminGenerate(body);
  }

  // 3. Report status/metadata
  @Get(":id")
  async getReport(@Param("id") id: string) {
    return this.reportsService.adminGetDetails(id);
  }

  // 4. Download a report
  @Get(":id/download")
  async downloadReport(@Param("id") id: string, @Res() res: Response) {
    const file = await this.reportsService.adminDownload(id);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${file.filename}"`
    );
    res.setHeader("Content-Type", file.mimetype);
    res.sendFile(file.path);
  }

  // 5. Delete a report
  @Delete(":id")
  async deleteReport(@Param("id") id: string) {
    return this.reportsService.adminDelete(id);
  }
}
