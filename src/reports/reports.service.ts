import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Like, Between } from "typeorm";
import { Report, ReportStatus, ReportType } from "../entities/report.entity";
import { User } from "../entities/user.entity";
import { ReportGeneratorService } from "./report-generator.service";
import { CreateReportDto } from "../admin-dashboard/dto/reports/create-report.dto";
import { ReportQueryDto } from "../admin-dashboard/dto/reports/report-query.dto";
import {
  ReportResponseDto,
  ReportListResponseDto,
} from "../admin-dashboard/dto/reports/report-response.dto";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @InjectRepository(Report)
    private readonly reportsRepository: Repository<Report>,
    private readonly reportGeneratorService: ReportGeneratorService
  ) {}

  async adminList(query: ReportQueryDto): Promise<ReportListResponseDto> {
    const {
      page,
      limit,
      search,
      type,
      status,
      dateFrom,
      dateTo,
      generatedBy,
      sortBy,
      sortOrder,
    } = query;

    const queryBuilder = this.reportsRepository
      .createQueryBuilder("report")
      .leftJoinAndSelect("report.generatedBy", "user");

    // Apply filters
    if (search) {
      queryBuilder.andWhere(
        "(report.name ILIKE :search OR report.description ILIKE :search)",
        { search: `%${search}%` }
      );
    }

    if (type) {
      queryBuilder.andWhere("report.type = :type", { type });
    }

    if (status) {
      queryBuilder.andWhere("report.status = :status", { status });
    }

    if (dateFrom) {
      queryBuilder.andWhere("report.createdAt >= :dateFrom", {
        dateFrom: new Date(dateFrom),
      });
    }

    if (dateTo) {
      queryBuilder.andWhere("report.createdAt <= :dateTo", {
        dateTo: new Date(dateTo),
      });
    }

    if (generatedBy) {
      queryBuilder.andWhere("report.generated_by = :generatedBy", {
        generatedBy,
      });
    }

    // Apply sorting
    const sortField =
      sortBy === "generatedBy" ? "user.display_name" : `report.${sortBy}`;
    queryBuilder.orderBy(sortField, sortOrder.toUpperCase() as "ASC" | "DESC");

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [reports, total] = await queryBuilder.getManyAndCount();

    return {
      items: reports.map((report) => this.mapToResponseDto(report)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async adminGenerate(
    createReportDto: CreateReportDto,
    user: User
  ): Promise<ReportResponseDto> {
    this.logger.log(
      `Generating new report: ${createReportDto.name} by user: ${user.id}`
    );

    // Create report entity
    const report = this.reportsRepository.create({
      name: createReportDto.name,
      description: createReportDto.description,
      type: createReportDto.type,
      parameters: createReportDto.parameters,
      status: ReportStatus.SCHEDULED,
      generatedBy: user,
      generated_by: user.id,
      dateFrom: createReportDto.dateFrom
        ? new Date(createReportDto.dateFrom)
        : null,
      dateTo: createReportDto.dateTo ? new Date(createReportDto.dateTo) : null,
      progress: 0,
      retentionDate: this.calculateRetentionDate(),
    });

    const savedReport = await this.reportsRepository.save(report);

    // Start background processing
    this.processReportGeneration(savedReport);

    return this.mapToResponseDto(savedReport);
  }

  private async processReportGeneration(report: Report): Promise<void> {
    try {
      // Update status to processing
      report.status = ReportStatus.PROCESSING;
      report.progress = 10;
      await this.reportsRepository.save(report);

      this.logger.log(`Processing report: ${report.id}`);

      // Generate the report
      const result = await this.reportGeneratorService.generateReport(report);

      // Update report with file information
      report.filePath = result.filePath;
      report.fileName = result.fileName;
      report.fileSize = result.fileSize;
      report.fileMimeType = this.getMimeType(report.type);
      report.status = ReportStatus.READY;
      report.progress = 100;

      await this.reportsRepository.save(report);

      this.logger.log(`Report generated successfully: ${report.id}`);
    } catch (error) {
      this.logger.error(`Report generation failed: ${report.id}`, error);

      // Update report with error information
      report.status = ReportStatus.FAILED;
      report.error = error.message;
      await this.reportsRepository.save(report);
    }
  }

  async adminGetDetails(id: string): Promise<ReportResponseDto> {
    const report = await this.reportsRepository.findOne({
      where: { id },
      relations: ["generatedBy"],
    });

    if (!report) {
      throw new NotFoundException("Report not found");
    }

    return this.mapToResponseDto(report);
  }

  async adminDownload(
    id: string
  ): Promise<{ path: string; filename: string; mimetype: string }> {
    const report = await this.reportsRepository.findOne({ where: { id } });

    if (!report) {
      throw new NotFoundException("Report not found");
    }

    if (report.status !== ReportStatus.READY) {
      throw new BadRequestException(
        `Report is not ready for download. Status: ${report.status}`
      );
    }

    if (!report.filePath || !fs.existsSync(report.filePath)) {
      throw new NotFoundException("Report file not found");
    }

    return {
      path: report.filePath,
      filename: report.fileName,
      mimetype: report.fileMimeType || "application/octet-stream",
    };
  }

  async adminDelete(id: string): Promise<{ success: boolean }> {
    const report = await this.reportsRepository.findOne({ where: { id } });

    if (!report) {
      throw new NotFoundException("Report not found");
    }

    // Delete file if it exists
    if (report.filePath && fs.existsSync(report.filePath)) {
      try {
        fs.unlinkSync(report.filePath);
        this.logger.log(`Deleted report file: ${report.filePath}`);
      } catch (error) {
        this.logger.error(
          `Failed to delete report file: ${report.filePath}`,
          error
        );
      }
    }

    // Delete report record
    await this.reportsRepository.delete(id);

    return { success: true };
  }

  // Cleanup old reports based on retention date
  async cleanupOldReports(): Promise<void> {
    const expiredReports = await this.reportsRepository.find({
      where: {
        retentionDate: Between(new Date("1970-01-01"), new Date()),
      },
    });

    for (const report of expiredReports) {
      await this.adminDelete(report.id);
    }

    this.logger.log(`Cleaned up ${expiredReports.length} expired reports`);
  }

  private mapToResponseDto(report: Report): ReportResponseDto {
    return {
      id: report.id,
      name: report.name,
      description: report.description,
      type: report.type,
      status: report.status,
      progress: report.progress,
      parameters: report.parameters,
      fileName: report.fileName,
      fileMimeType: report.fileMimeType,
      fileSize: report.fileSize,
      dateFrom: report.dateFrom,
      dateTo: report.dateTo,
      generatedBy: report.generatedBy
        ? {
            id: report.generatedBy.id,
            display_name: report.generatedBy.display_name,
            email: report.generatedBy.email,
          }
        : null,
      error: report.error,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      retentionDate: report.retentionDate,
    };
  }

  private getMimeType(type: ReportType): string {
    switch (type) {
      case ReportType.PDF:
        return "application/pdf";
      case ReportType.XLSX:
        return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      case ReportType.CSV:
        return "text/csv";
      case ReportType.JSON:
        return "application/json";
      default:
        return "application/octet-stream";
    }
  }

  private calculateRetentionDate(): Date {
    // Default retention period: 30 days
    const retentionDays = parseInt(process.env.REPORT_RETENTION_DAYS || "30");
    const retentionDate = new Date();
    retentionDate.setDate(retentionDate.getDate() + retentionDays);
    return retentionDate;
  }
}
