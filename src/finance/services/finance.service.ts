import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between, In } from "typeorm";
import { Project } from "../../entities/project.entity";
import { BudgetCategory } from "../entities/budget-category.entity";
import { ProjectTransaction } from "../entities/project-transaction.entity";
import { ProjectSavings } from "../entities/project-savings.entity";
import { BudgetAlert, AlertType } from "../entities/budget-alert.entity";
import { ProjectFinanceQueryDto } from "../dto/project-finance-query.dto";
import {
  ProjectFinanceListResponseDto,
  ProjectFinanceDto,
  FinanceMetricsDto,
} from "../dto/project-finance-response.dto";
import {
  CreateTransactionDto,
  UpdateTransactionDto,
  TransactionQueryDto,
} from "../dto/transaction.dto";
import { UpdateProjectBudgetDto } from "../dto/budget-update.dto";
import { TransactionService } from "./transaction.service";
import { BudgetManagementService } from "./budget-management.service";
import { toNumber } from "../../utils/amount.utils";

@Injectable()
export class FinanceService {
  private readonly logger = new Logger(FinanceService.name);

  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(BudgetCategory)
    private readonly budgetCategoryRepository: Repository<BudgetCategory>,
    @InjectRepository(ProjectTransaction)
    private readonly transactionRepository: Repository<ProjectTransaction>,
    @InjectRepository(ProjectSavings)
    private readonly savingsRepository: Repository<ProjectSavings>,
    @InjectRepository(BudgetAlert)
    private readonly alertRepository: Repository<BudgetAlert>,
    private readonly transactionService: TransactionService,
    private readonly budgetManagementService: BudgetManagementService
  ) {}

  async getProjectsFinance(
    query: ProjectFinanceQueryDto
  ): Promise<ProjectFinanceListResponseDto> {
    console.log('📄 [Finance Page] Finance list page accessed - starting recalculation...');
    const {
      page = 1,
      limit = 10,
      search,
      status,
      dateFrom,
      dateTo,
      budgetMin,
      budgetMax,
      savingsMin,
      savingsMax,
    } = query;

    // Build query
    const queryBuilder = this.projectRepository
      .createQueryBuilder("project")
      .leftJoinAndSelect("project.owner", "owner")
      .leftJoinAndSelect("project.collaborators", "collaborators");

    // Apply filters
    if (search) {
      queryBuilder.andWhere(
        "(project.title ILIKE :search OR project.description ILIKE :search)",
        {
          search: `%${search}%`,
        }
      );
    }

    if (status) {
      queryBuilder.andWhere("project.status = :status", { status });
    }

    if (dateFrom) {
      queryBuilder.andWhere("project.created_at >= :dateFrom", { dateFrom });
    }

    if (dateTo) {
      queryBuilder.andWhere("project.created_at <= :dateTo", { dateTo });
    }

    if (budgetMin !== undefined) {
      queryBuilder.andWhere("project.totalBudget >= :budgetMin", { budgetMin });
    }

    if (budgetMax !== undefined) {
      queryBuilder.andWhere("project.totalBudget <= :budgetMax", { budgetMax });
    }

    // Apply pagination
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const offset = (pageNum - 1) * limitNum;
    queryBuilder.skip(offset).take(limitNum);

    const [projects, total] = await queryBuilder.getManyAndCount();

    console.log(`📄 [Finance Page] Recalculating ${projects.length} projects before display...`);

    // Recalculate each project's spent amount before transforming to ensure accuracy
    // This ensures the displayed data is always correct
    await Promise.all(
      projects.map(async (project) => {
        try {
          await this.budgetManagementService.updateProjectSpentAmount(project.id);
        } catch (error) {
          this.logger.warn(`Failed to recalculate project ${project.id}: ${error.message}`);
          console.error(`❌ [Finance Page] Failed to recalculate project ${project.id}:`, error.message);
        }
      })
    );

    console.log(`✅ [Finance Page] Completed recalculation for ${projects.length} projects`);

    // Transform to DTOs
    const projectFinances = await Promise.all(
      projects.map(
        async (project) => await this.transformToProjectFinanceDto(project)
      )
    );

    // Filter by savings if specified
    let filteredProjects = projectFinances;
    if (savingsMin !== undefined || savingsMax !== undefined) {
      filteredProjects = projectFinances.filter((p) => {
        const savingsPercentage = p.savings.percentage;
        return (
          (savingsMin === undefined || savingsPercentage >= savingsMin) &&
          (savingsMax === undefined || savingsPercentage <= savingsMax)
        );
      });
    }

    // Calculate metrics
    const metrics = await this.calculateFinanceMetrics();

    // Calculate totals using database aggregation (optimized)
    // Use entity property names - TypeORM will map to database columns
    const totalsQueryBuilder = this.projectRepository
      .createQueryBuilder("project")
      .select("SUM(COALESCE(project.totalBudget, 0))", "totalBudget")
      .addSelect("SUM(COALESCE(project.spentAmount, 0))", "totalSpent");

    // Apply same filters as paginated query
    if (search) {
      totalsQueryBuilder.andWhere(
        "(project.title ILIKE :search OR project.description ILIKE :search)",
        { search: `%${search}%` }
      );
    }
    if (status) {
      totalsQueryBuilder.andWhere("project.status = :status", { status });
    }
    if (dateFrom) {
      totalsQueryBuilder.andWhere("project.created_at >= :dateFrom", { dateFrom });
    }
    if (dateTo) {
      totalsQueryBuilder.andWhere("project.created_at <= :dateTo", { dateTo });
    }
    if (budgetMin !== undefined) {
      totalsQueryBuilder.andWhere("project.totalBudget >= :budgetMin", { budgetMin });
    }
    if (budgetMax !== undefined) {
      totalsQueryBuilder.andWhere("project.totalBudget <= :budgetMax", { budgetMax });
    }

    const totalsResult = await totalsQueryBuilder.getRawOne();
    
    console.log('📊 Totals Query Result:', totalsResult);
    
    const totalBudget = totalsResult?.totalBudget ? parseFloat(totalsResult.totalBudget) : 0;
    const totalSpent = totalsResult?.totalSpent ? parseFloat(totalsResult.totalSpent) : 0;
    
    // Calculate remaining and validate (can be negative if over budget)
    const totalRemaining = totalBudget - totalSpent;
    // Clamp to reasonable range to prevent overflow
    const normalizedRemaining = Math.max(Math.min(totalRemaining, 9999999999999.99), -9999999999999.99);
    
    console.log('💰 Calculated Totals:', { totalBudget, totalSpent, totalRemaining: normalizedRemaining });

    return {
      projects: filteredProjects,
      metrics,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      totals: {
        budget: {
          total: totalBudget,
          remaining: normalizedRemaining,
        },
        spending: {
          total: totalSpent,
        },
        savings: {
          total: normalizedRemaining > 0 ? normalizedRemaining : 0,
          percentage: totalBudget > 0 ? (normalizedRemaining / totalBudget) * 100 : 0,
        },
      },
    };
  }

  async getProjectFinanceById(
    projectId: string,
    pagination?: { page: number; limit: number }
  ): Promise<ProjectFinanceDto> {
    console.log(`📄 [Finance Page] Project finance details accessed for project: ${projectId} - recalculating...`);
    
    // Recalculate this project's spent amount before returning data to ensure accuracy
    const updatedSpentAmount = await this.budgetManagementService.updateProjectSpentAmount(projectId);
    
    console.log(`✅ [Finance Page] Completed recalculation for project ${projectId}`);

    // Fetch the project with fresh data after recalculation
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: ["owner", "collaborators"],
    });

    if (!project) {
      throw new NotFoundException("Project not found");
    }

    // Ensure we use the freshly calculated spent amount
    if (updatedSpentAmount !== undefined) {
      project.spentAmount = updatedSpentAmount;
    }

    return await this.transformToProjectFinanceDto(project, pagination);
  }

  async getFinanceMetrics(): Promise<FinanceMetricsDto> {
    return await this.calculateFinanceMetrics();
  }

  async getTransactions(query: TransactionQueryDto) {
    return this.transactionService.getTransactions(query);
  }

  async createTransaction(
    createTransactionDto: CreateTransactionDto,
    userId: string,
    invoiceFile?: Express.Multer.File
  ) {
    return this.transactionService.createTransaction(createTransactionDto, userId, invoiceFile);
  }

  async updateTransaction(
    transactionId: string,
    updateTransactionDto: UpdateTransactionDto,
    userId: string
  ) {
    return this.transactionService.updateTransaction(transactionId, updateTransactionDto, userId);
  }

  async deleteTransaction(transactionId: string) {
    return this.transactionService.deleteTransaction(transactionId);
  }

  async updateProjectBudget(
    projectId: string,
    updateBudgetDto: UpdateProjectBudgetDto
  ) {
    return this.budgetManagementService.updateProjectBudget(projectId, updateBudgetDto);
  }

  private async transformToProjectFinanceDto(
    project: Project,
    pagination?: { page: number; limit: number }
  ): Promise<ProjectFinanceDto> {
    // Get budget categories
    const categories = await this.budgetCategoryRepository.find({
      where: { projectId: project.id, isActive: true },
    });

    // Get transactions with pagination if provided
    let transactions;
    let totalTransactions = 0;
    if (pagination) {
      const page = Number(pagination.page) || 1;
      const limit = Number(pagination.limit) || 10;
      const skip = (page - 1) * limit;
      
      const [transactionsList, total] = await this.transactionRepository.findAndCount({
        where: { projectId: project.id },
        relations: ["category", "creator"],
        order: { transactionDate: "DESC" },
        skip,
        take: limit,
      });
      transactions = transactionsList;
      totalTransactions = total;
    } else {
      // Default: get recent 50 transactions
      transactions = await this.transactionRepository.find({
        where: { projectId: project.id },
        relations: ["category", "creator"],
        order: { transactionDate: "DESC" },
        take: 50,
      });
      totalTransactions = transactions.length;
    }

    // Get savings
    const savings = await this.savingsRepository.find({
      where: { projectId: project.id },
    });

    // Calculate metrics - ensure all values are numbers
    const totalBudget = toNumber(project.totalBudget);
    const spentAmount = toNumber(project.spentAmount);
    const allocatedBudget = toNumber(project.allocatedBudget);
    
    // Calculate remaining budget and validate
    const remaining = totalBudget - spentAmount;
    // Clamp to reasonable range (can be negative if over budget)
    const normalizedRemaining = Math.max(remaining, -9999999999999.99); // Allow negative for over-budget
    
    const budgetDto = {
      total: totalBudget,
      allocated: allocatedBudget,
      remaining: normalizedRemaining,
      categories: categories.map((cat) => ({
        id: cat.id,
        projectId: cat.projectId,
        name: cat.name,
        description: cat.description,
        budgetedAmount: cat.budgetedAmount,
        spentAmount: cat.spentAmount,
        remainingAmount: cat.remainingAmount,
        utilizationPercentage: cat.utilizationPercentage,
        status: cat.status,
        isActive: cat.isActive,
      })),
    };

    const spendingDto = {
      total: project.spentAmount,
      byCategory: categories.map((cat) => ({
        categoryId: cat.id,
        categoryName: cat.name,
        budgetedAmount: cat.budgetedAmount,
        spentAmount: cat.spentAmount,
        remainingAmount: cat.remainingAmount,
        utilizationPercentage: cat.utilizationPercentage,
        status: cat.status,
      })),
      byMonth: await this.calculateMonthlySpending(project.id),
      transactions: transactions.map((t) => ({
        id: t.id,
        projectId: t.projectId,
        categoryId: t.categoryId,
        transactionNumber: t.transactionNumber,
        amount: t.amount,
        type: t.type,
        description: t.description,
        vendor: t.vendor,
        invoiceNumber: t.invoiceNumber,
        transactionDate: this.formatDateToISOString(t.transactionDate),
        approvalStatus: t.approvalStatus,
        approvedBy: t.approvedBy,
        approvedAt: t.approvedAt
          ? this.formatDateToISOString(t.approvedAt)
          : undefined,
        receiptUrl: t.receiptUrl,
        notes: t.notes,
        createdAt: this.formatDateToISOString(t.createdAt),
        createdBy: t.createdBy,
      })),
    };

    const savingsDto = {
      total: project.estimatedSavings,
      percentage:
        project.totalBudget > 0
          ? (project.estimatedSavings / project.totalBudget) * 100
          : 0,
      breakdown: savings.map((s) => ({
        category: s.category,
        budgetedAmount: s.budgetedAmount,
        actualAmount: s.actualAmount,
        savedAmount: s.savedAmount,
        savingsPercentage: s.savingsPercentage,
        reason: s.reason,
      })),
      reasons: savings.map((s) => ({
        category: s.category,
        reason: s.reason || "Cost optimization",
        description: s.description,
        savedAmount: s.savedAmount,
        achievedDate: s.achievedDate
          ? this.formatDateToISOString(s.achievedDate)
          : undefined,
      })),
    };

    const timelineDto = {
      startDate: project.start_date
        ? this.formatDateToISOString(project.start_date)
        : "",
      endDate: project.end_date
        ? this.formatDateToISOString(project.end_date)
        : "",
      estimatedEndDate: project.end_date
        ? this.formatDateToISOString(project.end_date)
        : "",
    };

    const result: any = {
      id: project.id,
      projectId: project.id,
      projectName: project.title,
      status: project.status,
      budget: budgetDto,
      spending: spendingDto,
      savings: savingsDto,
      timeline: timelineDto,
      lastUpdated: project.budgetLastUpdated
        ? this.formatDateToISOString(project.budgetLastUpdated)
        : this.formatDateToISOString(project.updated_at),
    };

    // Add pagination metadata if pagination was used
    if (pagination) {
      result.transactionsPagination = {
        page: Number(pagination.page) || 1,
        limit: Number(pagination.limit) || 10,
        total: totalTransactions,
        totalPages: Math.ceil(totalTransactions / (Number(pagination.limit) || 10)),
      };
    }

    return result;
  }

  /**
   * Helper method to safely convert Date objects or date strings to ISO string format
   * Handles both Date objects and string dates from the database
   */
  private formatDateToISOString(
    date: Date | string | null | undefined
  ): string {
    if (!date) {
      return "";
    }
    if (typeof date === "string") {
      // If it's already a string, try to parse it and convert to ISO
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        // If parsing fails, return the original string or empty string
        return date;
      }
      return parsedDate.toISOString();
    }
    if (date instanceof Date) {
      return date.toISOString();
    }
    return "";
  }

  private async calculateFinanceMetrics(): Promise<FinanceMetricsDto> {
    try {
      // Use database aggregations instead of loading all projects
      const result = await this.projectRepository
        .createQueryBuilder("project")
        .select("COUNT(project.id)", "totalProjects")
        .addSelect("SUM(COALESCE(project.total_budget, 0))", "totalBudget")
        .addSelect("SUM(COALESCE(project.spent_amount, 0))", "totalSpent")
        .addSelect("SUM(COALESCE(project.estimated_savings, 0))", "totalSaved")
        .addSelect(
          `SUM(CASE WHEN COALESCE(project.spent_amount, 0) > COALESCE(project.total_budget, 0) THEN 1 ELSE 0 END)`,
          "projectsOverBudget"
        )
        .addSelect(
          `SUM(CASE WHEN COALESCE(project.spent_amount, 0) < COALESCE(project.total_budget, 0) AND COALESCE(project.spent_amount, 0) > 0 THEN 1 ELSE 0 END)`,
          "projectsUnderBudget"
        )
        .getRawOne();

      const totalProjects = parseInt(result?.totalProjects) || 0;
      const totalBudget = parseFloat(result?.totalBudget) || 0;
      const totalSpent = parseFloat(result?.totalSpent) || 0;
      const totalSaved = parseFloat(result?.totalSaved) || 0;
      const avgSavingsPercentage = totalBudget > 0 ? (totalSaved / totalBudget) * 100 : 0;
      const projectsOverBudget = parseInt(result?.projectsOverBudget) || 0;
      const projectsUnderBudget = parseInt(result?.projectsUnderBudget) || 0;

      return {
        totalProjects,
        totalBudget,
        totalSpent,
        totalSaved,
        avgSavingsPercentage,
        projectsOverBudget,
        projectsUnderBudget,
      };
    } catch (error) {
      console.error("Error in calculateFinanceMetrics:", error);
      // Return safe defaults
      return {
        totalProjects: 0,
        totalBudget: 0,
        totalSpent: 0,
        totalSaved: 0,
        avgSavingsPercentage: 0,
        projectsOverBudget: 0,
        projectsUnderBudget: 0,
      };
    }
  }

  private async calculateMonthlySpending(projectId: string) {
    // This would typically involve more complex queries
    // For now, return a simplified version
    return [
      {
        month: "2024-01",
        budgetedAmount: 10000,
        spentAmount: 9500,
        variance: -500,
        variancePercentage: -5,
      },
    ];
  }

  // Budget management methods moved to BudgetManagementService

  /**
   * Recalculate all projects' spent amounts from transactions
   * This fixes any incorrect calculations
   */
  async recalculateAllProjectsSpentAmounts() {
    return await this.budgetManagementService.recalculateAllProjectsSpentAmounts();
  }
  // Transaction methods moved to TransactionService

  // Admin Finance Methods
  async getAdminFinancialMetrics() {
    const [totalProjects, totalBudget, totalSpent, totalSaved] =
      await Promise.all([
        this.projectRepository.count(),
        this.projectRepository
          .createQueryBuilder("project")
          .select("SUM(project.totalBudget)", "total")
          .getRawOne()
          .then((result) => parseFloat(result?.total || "0")),
        this.transactionRepository
          .createQueryBuilder("transaction")
          .select("SUM(transaction.amount)", "total")
          .where("transaction.type = :type", { type: "expense" })
          .getRawOne()
          .then((result) => parseFloat(result?.total || "0")),
        // Calculate savings: use project estimatedSavings as it represents total savings per project
        this.projectRepository
          .createQueryBuilder("project")
          .select("SUM(project.estimatedSavings)", "total")
          .getRawOne()
          .then((result) => parseFloat(result?.total || "0")),
      ]);

    const projectsOverBudget = await this.projectRepository.count({
      where: { financialStatus: "over_budget" },
    });

    const projectsUnderBudget = await this.projectRepository.count({
      where: { financialStatus: "on_track" },
    });

    const avgSavingsPercentage =
      totalBudget > 0 ? (totalSaved / totalBudget) * 100 : 0;

    return {
      totalProjects,
      totalBudget,
      totalSpent,
      totalSaved,
      avgSavingsPercentage,
      projectsOverBudget,
      projectsUnderBudget,
    };
  }

  async getRevenueBreakdown() {
    const revenueData = await this.transactionRepository
      .createQueryBuilder("transaction")
      .leftJoinAndSelect("transaction.category", "category")
      .select("category.name", "category")
      .addSelect("SUM(transaction.amount)", "amount")
      .where("transaction.type = :type", { type: "income" })
      .groupBy("category.name")
      .getRawMany();

    return revenueData.map((item) => ({
      category: item.category || "Uncategorized",
      amount: parseFloat(item.amount || "0"),
    }));
  }

  async getExpenseBreakdown() {
    const expenseData = await this.transactionRepository
      .createQueryBuilder("transaction")
      .leftJoinAndSelect("transaction.category", "category")
      .select("category.name", "category")
      .addSelect("SUM(transaction.amount)", "amount")
      .where("transaction.type = :type", { type: "expense" })
      .groupBy("category.name")
      .getRawMany();

    return expenseData.map((item) => ({
      category: item.category || "Uncategorized",
      amount: parseFloat(item.amount || "0"),
    }));
  }
}
