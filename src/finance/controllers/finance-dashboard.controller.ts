import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole } from "../../entities/user.entity";
import { FinanceService } from "../services/finance.service";
import { InventoryService } from "../../inventory/inventory.service";
import { DashboardService } from "../../dashboard/dashboard.service";
import { InventoryQueryDto } from "../../inventory/dto/inventory-query.dto";
import { TransactionQueryDto } from "../dto/transaction.dto";
import { RequestWithUser } from "../../auth/interfaces/request-with-user.interface";

@Controller("finance/dashboard")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.FINANCE)
export class FinanceDashboardController {
  constructor(
    private readonly financeService: FinanceService,
    private readonly inventoryService: InventoryService,
    private readonly dashboardService: DashboardService
  ) {}

  /**
   * GET /finance/dashboard/overview
   * Returns overview data including dashboard stats, inventory stats, and finance metrics
   */
  @Get("overview")
  async getOverview(@Request() req: RequestWithUser) {
    try {
      const userId = req.user.id;
      const startTime = Date.now();

      const [dashboardStats, inventoryStats, financeMetrics] = await Promise.all([
        this.dashboardService
          .getUserStatsForDashboard(userId)
          .catch((err) => {

            return null;
          }),
        this.inventoryService.getStats().catch((err) => {

          return null;
        }),
        this.financeService.getFinanceMetrics().catch((err) => {

          return null;
        }),
      ]);

      const duration = Date.now() - startTime;

      return {
        section: "overview",
        role: "finance",
        timestamp: new Date().toISOString(),
        performance: {
          duration: `${duration}ms`,
        },
        data: {
          dashboard: dashboardStats,
          inventory: inventoryStats,
          finance: financeMetrics,
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          section: "overview",
          error: error.message || "Failed to fetch overview data",
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * GET /finance/dashboard/inventory
   * Returns inventory data with filtering and pagination
   */
  @Get("inventory")
  async getInventory(
    @Query() query: InventoryQueryDto,
    @Request() req: RequestWithUser
  ) {
    try {
      const startTime = Date.now();
      const inventoryData = await this.inventoryService.findAll(query);
      const inventoryStats = await this.inventoryService.getStats();
      const lowStockItems = await this.inventoryService.findAll({
        ...query,
        low_stock: true,
        page: 1,
        limit: 10,
      });

      const duration = Date.now() - startTime;

      return {
        section: "inventory",
        role: "finance",
        timestamp: new Date().toISOString(),
        performance: {
          duration: `${duration}ms`,
        },
        data: {
          items: inventoryData.items,
          total: inventoryData.total,
          page: inventoryData.page,
          limit: inventoryData.limit,
          totalPages: inventoryData.totalPages,
          stats: inventoryStats,
          lowStockItems: lowStockItems.items,
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          section: "inventory",
          error: error.message || "Failed to fetch inventory data",
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * GET /finance/dashboard/financial
   * Returns financial data including transactions, metrics, and project finance
   */
  @Get("financial")
  async getFinancial(
    @Query() transactionQuery: TransactionQueryDto,
    @Request() req: RequestWithUser
  ) {
    try {
      const startTime = Date.now();

      const transactionParams: TransactionQueryDto = {
        page: transactionQuery?.page || 1,
        limit: transactionQuery?.limit || 10,
        ...(transactionQuery?.projectId && { projectId: transactionQuery.projectId }),
        ...(transactionQuery?.category && { category: transactionQuery.category }),
        ...(transactionQuery?.type && { type: transactionQuery.type }),
        ...(transactionQuery?.dateFrom && { dateFrom: transactionQuery.dateFrom }),
        ...(transactionQuery?.dateTo && { dateTo: transactionQuery.dateTo }),
      };

      const [transactions, financeMetrics, projectsFinance] = await Promise.all([
        this.financeService.getTransactions(transactionParams).catch((err) => {

          return { transactions: [], total: 0, page: 1, limit: 10, totalPages: 0 };
        }),
        this.financeService.getFinanceMetrics().catch((err) => {

          return {
            totalProjects: 0,
            totalBudget: 0,
            totalSpent: 0,
            totalSaved: 0,
            avgSavingsPercentage: 0,
            projectsOverBudget: 0,
            projectsUnderBudget: 0,
          };
        }),
        this.financeService.getProjectsFinance({}).catch((err) => {

          return { projects: [], metrics: null, total: 0, page: 1, limit: 10, totalPages: 0 };
        }),
      ]);

      let projectFinanceDetails = null;
      if (transactionParams.projectId) {
        try {
          projectFinanceDetails = await this.financeService.getProjectFinanceById(
            transactionParams.projectId
          );
        } catch (error) {
          console.warn(
            `Project ${transactionParams.projectId} not found:`,
            error.message
          );
        }
      }

      const duration = Date.now() - startTime;

      return {
        section: "financial",
        role: "finance",
        timestamp: new Date().toISOString(),
        performance: {
          duration: `${duration}ms`,
        },
        data: {
          transactions,
          metrics: financeMetrics,
          projects: projectsFinance,
          projectDetails: projectFinanceDetails,
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          section: "financial",
          error: error.message || "Failed to fetch financial data",
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * GET /finance/dashboard/reports
   * Returns reports data and available report options
   */
  @Get("reports")
  async getReports(@Request() req: RequestWithUser) {
    try {
      const startTime = Date.now();

      const [financeMetrics, projectsFinance, inventoryStats] = await Promise.all([
        this.financeService.getFinanceMetrics().catch((err) => {

          return {
            totalProjects: 0,
            totalBudget: 0,
            totalSpent: 0,
            totalSaved: 0,
            avgSavingsPercentage: 0,
            projectsOverBudget: 0,
            projectsUnderBudget: 0,
          };
        }),
        this.financeService.getProjectsFinance({}).catch((err) => {

          return { projects: [], metrics: null, total: 0, page: 1, limit: 10, totalPages: 0 };
        }),
        this.inventoryService.getStats().catch((err) => {

          return null;
        }),
      ]);

      const duration = Date.now() - startTime;

      return {
        section: "reports",
        role: "finance",
        timestamp: new Date().toISOString(),
        performance: {
          duration: `${duration}ms`,
        },
        data: {
          financeMetrics,
          projects: projectsFinance,
          inventory: inventoryStats,
          availableReports: [
            {
              type: "financial_summary",
              name: "Financial Summary Report",
              description: "Complete financial overview with transactions and metrics",
            },
            {
              type: "project_finance",
              name: "Project Finance Report",
              description: "Detailed financial breakdown by project",
            },
            {
              type: "inventory_report",
              name: "Inventory Report",
              description: "Complete inventory status and statistics",
            },
            {
              type: "transaction_history",
              name: "Transaction History",
              description: "Detailed transaction history with filters",
            },
          ],
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          section: "reports",
          error: error.message || "Failed to fetch reports data",
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}

