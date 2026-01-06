import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpException,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole } from "../../entities/user.entity";
import { FinanceService } from "../services/finance.service";
import { AnalyticsService } from "../services/analytics.service";
import { ProjectFinanceQueryDto } from "../dto/project-finance-query.dto";
import {
  CreateTransactionDto,
  UpdateTransactionDto,
  TransactionQueryDto,
} from "../dto/transaction.dto";
import {
  UpdateProjectBudgetDto,
  BudgetAlertConfigDto,
} from "../dto/budget-update.dto";
import { GenerateReportDto } from "../dto/generate-report.dto";
import { FinanceReportGeneratorService } from "../services/finance-report-generator.service";
import { Res, Get as GetDecorator } from "@nestjs/common";
import { Response } from "express";
import * as fs from "fs";
import * as path from "path";

@Controller("admin/finance")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.FINANCE)
export class FinanceController {
  constructor(
    private readonly financeService: FinanceService,
    private readonly analyticsService: AnalyticsService,
    private readonly reportGeneratorService: FinanceReportGeneratorService
  ) {}

  // 1.1 GET /api/admin/finance/projects
  @Get("projects")
  async getProjectsFinance(@Query() query: ProjectFinanceQueryDto) {
    return await this.financeService.getProjectsFinance(query);
  }

  // 1.2 GET /api/admin/finance/projects/:id
  @Get("projects/:id")
  async getProjectFinance(@Param("id") id: string) {
    return await this.financeService.getProjectFinanceById(id);
  }

  // 1.3 GET /api/admin/finance/metrics
  @Get("metrics")
  async getFinanceMetrics() {
    return await this.financeService.getFinanceMetrics();
  }

  // 1.4 GET /api/admin/finance/transactions
  @Get("transactions")
  async getTransactions(@Query() query: TransactionQueryDto) {
    return await this.financeService.getTransactions(query);
  }

  // 1.5 POST /api/admin/finance/transactions
  @Post("transactions")
  async createTransaction(
    @Body() createTransactionDto: CreateTransactionDto,
    @Request() req
  ) {
    const userId = req.user.id;
    return await this.financeService.createTransaction(
      createTransactionDto,
      userId
    );
  }

  // 1.5.1 PUT /api/admin/finance/transactions/:id
  @Put("transactions/:id")
  async updateTransaction(
    @Param("id") id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
    @Request() req
  ) {
    const userId = req.user.id;
    return await this.financeService.updateTransaction(
      id,
      updateTransactionDto,
      userId
    );
  }

  // 1.5.2 PATCH /api/admin/finance/transactions/:id (alias for PUT)
  @Patch("transactions/:id")
  async patchTransaction(
    @Param("id") id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
    @Request() req
  ) {
    const userId = req.user.id;
    return await this.financeService.updateTransaction(
      id,
      updateTransactionDto,
      userId
    );
  }

  // 1.5.3 DELETE /api/admin/finance/transactions/:id
  @Delete("transactions/:id")
  async deleteTransaction(@Param("id") id: string) {
    return await this.financeService.deleteTransaction(id);
  }

  // 1.6 PUT /api/admin/finance/projects/:id/budget
  @Put("projects/:id/budget")
  async updateProjectBudget(
    @Param("id") id: string,
    @Body() updateBudgetDto: UpdateProjectBudgetDto
  ) {
    return await this.financeService.updateProjectBudget(id, updateBudgetDto);
  }

  // 1.7 POST /api/admin/finance/reports/generate
  @Post("reports/generate")
  async generateFinanceReport(
    @Body() generateReportDto: GenerateReportDto,
    @Request() req
  ) {
    try {
      const userId = req.user.id;
      const result = await this.reportGeneratorService.generateReport(
        generateReportDto,
        userId
      );
      return {
        success: true,
        filePath: result.filePath,
        fileName: result.fileName,
        fileSize: result.fileSize,
        downloadUrl: `/admin/finance/reports/download/${result.fileName}`,
      };
    } catch (error) {
      throw new HttpException(
        error.message || "Failed to generate report",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // 1.7.1 GET /api/admin/finance/reports/download/:fileName
  @GetDecorator("reports/download/:fileName")
  async downloadReport(
    @Param("fileName") fileName: string,
    @Res() res: Response
  ) {
    const filePath = path.resolve(process.cwd(), "uploads", "reports", fileName);

    if (!fs.existsSync(filePath)) {
      throw new HttpException("File not found", HttpStatus.NOT_FOUND);
    }

    const mimeType = fileName.endsWith(".pdf")
      ? "application/pdf"
      : fileName.endsWith(".xlsx")
        ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        : fileName.endsWith(".docx")
          ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          : "application/octet-stream";

    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    return res.sendFile(filePath);
  }

  // 1.8 GET /api/admin/finance/analytics/spending-trends
  @Get("analytics/spending-trends")
  async getSpendingTrends(
    @Query("period") period: string = "monthly",
    @Query("projectId") projectId?: string,
    @Query("dateFrom") dateFrom?: string,
    @Query("dateTo") dateTo?: string
  ) {
    return await this.analyticsService.getSpendingTrends(
      period,
      projectId,
      dateFrom,
      dateTo
    );
  }

  // 1.9 GET /api/admin/finance/analytics/category-breakdown
  @Get("analytics/category-breakdown")
  async getCategoryBreakdown() {
    return await this.analyticsService.getCategoryBreakdown();
  }

  // 1.10 POST /api/admin/finance/budget-alerts
  @Post("budget-alerts")
  async configureBudgetAlerts(@Body() alertConfig: BudgetAlertConfigDto) {
    // This would be implemented to configure alert thresholds
    throw new HttpException(
      "Budget alerts configuration will be implemented",
      HttpStatus.NOT_IMPLEMENTED
    );
  }
}
