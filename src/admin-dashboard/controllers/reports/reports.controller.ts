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
  Request,
  HttpStatus,
  HttpException,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { ReportsService } from "../../../reports/reports.service";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { CreateReportDto } from "../../dto/reports/create-report.dto";
import { ReportQueryDto } from "../../dto/reports/report-query.dto";
import {
  ReportResponseDto,
  ReportListResponseDto,
} from "../../dto/reports/report-response.dto";
import { Response } from "express";

@Controller("consultant/reports")
@UseGuards(JwtAuthGuard)
export class AdminReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  async listReports(
    @Query() query: ReportQueryDto
  ): Promise<ReportListResponseDto> {
    return this.reportsService.adminList(query);
  }

  @Post()
  async generateReport(
    @Body() createReportDto: CreateReportDto,
    @Request() req
  ): Promise<ReportResponseDto> {
    const user = req.user;

    if (!user) {
      throw new BadRequestException("User not found in request");
    }

    return this.reportsService.adminGenerate(createReportDto, user);
  }

  @Get(":id")
  async getReport(@Param("id") id: string): Promise<ReportResponseDto> {
    return this.reportsService.adminGetDetails(id);
  }

  @Get(":id/download")
  async downloadReport(@Param("id") id: string, @Res() res: Response) {
    try {
      const file = await this.reportsService.adminDownload(id);

      // Set appropriate headers
      res.setHeader("Content-Type", file.mimetype);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${file.filename}"`
      );

      // Send file
      res.sendFile(file.path);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      } else if (error instanceof BadRequestException) {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      } else {
        throw new HttpException(
          "Failed to download report",
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }
  }

  @Delete(":id")
  async deleteReport(@Param("id") id: string): Promise<{ success: boolean }> {
    return this.reportsService.adminDelete(id);
  }

  @Post("cleanup")
  async cleanupOldReports(): Promise<{ message: string }> {
    await this.reportsService.cleanupOldReports();
    return { message: "Old reports cleanup completed" };
  }
}
