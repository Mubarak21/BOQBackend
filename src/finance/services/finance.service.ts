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
    private readonly alertRepository: Repository<BudgetAlert>
  ) {}

  async getProjectsFinance(
    query: ProjectFinanceQueryDto
  ): Promise<ProjectFinanceListResponseDto> {
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

    return {
      projects: filteredProjects,
      metrics,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  async getProjectFinanceById(projectId: string): Promise<ProjectFinanceDto> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: ["owner", "collaborators"],
    });

    if (!project) {
      throw new NotFoundException("Project not found");
    }

    return await this.transformToProjectFinanceDto(project);
  }

  async getFinanceMetrics(): Promise<FinanceMetricsDto> {
    return await this.calculateFinanceMetrics();
  }

  async getTransactions(query: TransactionQueryDto) {
    const { projectId, category, dateFrom, dateTo, type, page = 1, limit = 10 } = query;

    const queryBuilder = this.transactionRepository
      .createQueryBuilder("transaction")
      .leftJoinAndSelect("transaction.project", "project")
      .leftJoinAndSelect("transaction.category", "budgetCategory")
      .leftJoinAndSelect("transaction.creator", "creator");

    if (projectId) {
      queryBuilder.andWhere("transaction.projectId = :projectId", {
        projectId,
      });
    }

    if (category) {
      queryBuilder.andWhere("budgetCategory.name ILIKE :category", {
        category: `%${category}%`,
      });
    }

    if (dateFrom) {
      queryBuilder.andWhere("transaction.transactionDate >= :dateFrom", {
        dateFrom,
      });
    }

    if (dateTo) {
      queryBuilder.andWhere("transaction.transactionDate <= :dateTo", {
        dateTo,
      });
    }

    if (type) {
      queryBuilder.andWhere("transaction.type = :type", { type });
    }

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const offset = (pageNum - 1) * limitNum;
    queryBuilder.skip(offset).take(limitNum);

    const [transactions, total] = await queryBuilder.getManyAndCount();

    return {
      transactions,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  async createTransaction(
    createTransactionDto: CreateTransactionDto,
    userId: string
  ) {
    const {
      projectId,
      categoryId,
      amount,
      type,
      description,
      vendor,
      transactionDate,
      receiptUrl,
    } = createTransactionDto;

    // Verify project exists
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException("Project not found");
    }

    // Verify category exists
    const category = await this.budgetCategoryRepository.findOne({
      where: { id: categoryId },
    });
    if (!category) {
      throw new NotFoundException("Budget category not found");
    }

    // Generate transaction number
    const transactionNumber = await this.generateTransactionNumber();

    // Create transaction
    const transaction = this.transactionRepository.create({
      projectId,
      categoryId,
      transactionNumber,
      amount,
      type,
      description,
      vendor,
      transactionDate: new Date(transactionDate),
      receiptUrl,
      createdBy: userId,
    });

    const savedTransaction = await this.transactionRepository.save(transaction);

    // Update category spent amount
    await this.updateCategorySpentAmount(categoryId);

    // Update project spent amount
    await this.updateProjectSpentAmount(projectId);

    // Check for budget alerts
    await this.checkAndCreateBudgetAlerts(projectId);

    return savedTransaction;
  }

  async updateTransaction(
    transactionId: string,
    updateTransactionDto: UpdateTransactionDto,
    userId: string
  ) {
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new NotFoundException("Transaction not found");
    }

    const oldProjectId = transaction.projectId;
    const oldCategoryId = transaction.categoryId;
    const oldAmount = transaction.amount;

    // If project is being changed, verify new project exists
    if (
      updateTransactionDto.projectId &&
      updateTransactionDto.projectId !== transaction.projectId
    ) {
      const project = await this.projectRepository.findOne({
        where: { id: updateTransactionDto.projectId },
      });
      if (!project) {
        throw new NotFoundException("Project not found");
      }
    }

    // If category is being changed, verify new category exists
    if (
      updateTransactionDto.categoryId &&
      updateTransactionDto.categoryId !== transaction.categoryId
    ) {
      const category = await this.budgetCategoryRepository.findOne({
        where: { id: updateTransactionDto.categoryId },
      });
      if (!category) {
        throw new NotFoundException("Budget category not found");
      }
    }

    // Update transaction fields
    if (updateTransactionDto.projectId !== undefined) {
      transaction.projectId = updateTransactionDto.projectId;
    }
    if (updateTransactionDto.categoryId !== undefined) {
      transaction.categoryId = updateTransactionDto.categoryId;
    }
    if (updateTransactionDto.amount !== undefined) {
      transaction.amount = updateTransactionDto.amount;
    }
    if (updateTransactionDto.type !== undefined) {
      transaction.type = updateTransactionDto.type;
    }
    if (updateTransactionDto.description !== undefined) {
      transaction.description = updateTransactionDto.description;
    }
    if (updateTransactionDto.vendor !== undefined) {
      transaction.vendor = updateTransactionDto.vendor;
    }
    if (updateTransactionDto.transactionDate !== undefined) {
      transaction.transactionDate = new Date(
        updateTransactionDto.transactionDate
      );
    }
    if (updateTransactionDto.invoiceNumber !== undefined) {
      transaction.invoiceNumber = updateTransactionDto.invoiceNumber;
    }
    if (updateTransactionDto.receiptUrl !== undefined) {
      transaction.receiptUrl = updateTransactionDto.receiptUrl;
    }
    if (updateTransactionDto.notes !== undefined) {
      transaction.notes = updateTransactionDto.notes;
    }

    const updatedTransaction =
      await this.transactionRepository.save(transaction);

    // Update spent amounts for old and new categories/projects if changed
    if (oldCategoryId) {
      await this.updateCategorySpentAmount(oldCategoryId);
    }
    if (oldProjectId) {
      await this.updateProjectSpentAmount(oldProjectId);
    }

    if (transaction.categoryId && transaction.categoryId !== oldCategoryId) {
      await this.updateCategorySpentAmount(transaction.categoryId);
    }
    if (transaction.projectId && transaction.projectId !== oldProjectId) {
      await this.updateProjectSpentAmount(transaction.projectId);
    } else if (
      transaction.projectId === oldProjectId &&
      transaction.amount !== oldAmount
    ) {
      // Amount changed but project didn't, still need to update
      await this.updateProjectSpentAmount(transaction.projectId);
    }

    // Check for budget alerts
    if (transaction.projectId) {
      await this.checkAndCreateBudgetAlerts(transaction.projectId);
    }

    return updatedTransaction;
  }

  async deleteTransaction(transactionId: string) {
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new NotFoundException("Transaction not found");
    }

    const projectId = transaction.projectId;
    const categoryId = transaction.categoryId;

    // Delete the transaction
    await this.transactionRepository.remove(transaction);

    // Update spent amounts
    if (categoryId) {
      await this.updateCategorySpentAmount(categoryId);
    }
    if (projectId) {
      await this.updateProjectSpentAmount(projectId);
      await this.checkAndCreateBudgetAlerts(projectId);
    }

    return { success: true, message: "Transaction deleted successfully" };
  }

  async updateProjectBudget(
    projectId: string,
    updateBudgetDto: UpdateProjectBudgetDto
  ) {
    const { totalBudget, categories } = updateBudgetDto;

    // Verify project exists
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException("Project not found");
    }

    // Update project total budget
    project.totalBudget = totalBudget;
    project.budgetLastUpdated = new Date();
    await this.projectRepository.save(project);

    // Update category budgets
    for (const categoryUpdate of categories) {
      const category = await this.budgetCategoryRepository.findOne({
        where: { id: categoryUpdate.categoryId },
      });

      if (category) {
        category.budgetedAmount = categoryUpdate.budgetedAmount;
        await this.budgetCategoryRepository.save(category);
      }
    }

    // Recalculate allocated budget
    await this.updateProjectAllocatedBudget(projectId);

    // Update financial status
    await this.updateProjectFinancialStatus(projectId);

    return { success: true };
  }

  private async transformToProjectFinanceDto(
    project: Project
  ): Promise<ProjectFinanceDto> {
    // Get budget categories
    const categories = await this.budgetCategoryRepository.find({
      where: { projectId: project.id, isActive: true },
    });

    // Get transactions
    const transactions = await this.transactionRepository.find({
      where: { projectId: project.id },
      relations: ["category", "creator"],
      order: { transactionDate: "DESC" },
      take: 50, // Limit to recent transactions
    });

    // Get savings
    const savings = await this.savingsRepository.find({
      where: { projectId: project.id },
    });

    // Calculate metrics
    const budgetDto = {
      total: project.totalBudget,
      allocated: project.allocatedBudget,
      remaining: project.totalBudget - project.spentAmount,
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

    return {
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
    const projects = await this.projectRepository.find();

    const totalProjects = projects.length;
    const totalBudget = projects.reduce((sum, p) => {
      const budget = p.totalBudget != null ? Number(p.totalBudget) : 0;
      return sum + (isNaN(budget) ? 0 : budget);
    }, 0);
    const totalSpent = projects.reduce((sum, p) => {
      const spent = p.spentAmount != null ? Number(p.spentAmount) : 0;
      return sum + (isNaN(spent) ? 0 : spent);
    }, 0);
    const totalSaved = projects.reduce((sum, p) => {
      const saved = p.estimatedSavings != null ? Number(p.estimatedSavings) : 0;
      return sum + (isNaN(saved) ? 0 : saved);
    }, 0);
    const avgSavingsPercentage =
      totalBudget > 0 ? (totalSaved / totalBudget) * 100 : 0;

    const projectsOverBudget = projects.filter((p) => {
      const spent = p.spentAmount != null ? Number(p.spentAmount) : 0;
      const budget = p.totalBudget != null ? Number(p.totalBudget) : 0;
      return !isNaN(spent) && !isNaN(budget) && spent > budget;
    }).length;
    const projectsUnderBudget = projects.filter((p) => {
      const spent = p.spentAmount != null ? Number(p.spentAmount) : 0;
      const budget = p.totalBudget != null ? Number(p.totalBudget) : 0;
      return !isNaN(spent) && !isNaN(budget) && spent < budget;
    }).length;

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

  private async generateTransactionNumber(): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    const prefix = `TXN${year}${month}${day}`;

    // Find the last transaction number for today
    const lastTransaction = await this.transactionRepository
      .createQueryBuilder("transaction")
      .where("transaction.transactionNumber LIKE :prefix", {
        prefix: `${prefix}%`,
      })
      .orderBy("transaction.transactionNumber", "DESC")
      .getOne();

    let sequence = 1;
    if (lastTransaction) {
      const lastSequence = parseInt(
        lastTransaction.transactionNumber.substr(-4)
      );
      sequence = lastSequence + 1;
    }

    return `${prefix}${String(sequence).padStart(4, "0")}`;
  }

  private async updateCategorySpentAmount(categoryId: string) {
    const transactions = await this.transactionRepository.find({
      where: { categoryId },
    });

    const totalSpent = transactions.reduce((sum, t) => {
      return t.type === "expense" ? sum + t.amount : sum - t.amount;
    }, 0);

    await this.budgetCategoryRepository.update(categoryId, {
      spentAmount: totalSpent,
    });
  }

  private async updateProjectSpentAmount(projectId: string) {
    const categories = await this.budgetCategoryRepository.find({
      where: { projectId },
    });

    const totalSpent = categories.reduce((sum, c) => sum + c.spentAmount, 0);

    await this.projectRepository.update(projectId, {
      spentAmount: totalSpent,
    });
  }

  private async updateProjectAllocatedBudget(projectId: string) {
    const categories = await this.budgetCategoryRepository.find({
      where: { projectId, isActive: true },
    });

    const totalAllocated = categories.reduce(
      (sum, c) => sum + c.budgetedAmount,
      0
    );

    await this.projectRepository.update(projectId, {
      allocatedBudget: totalAllocated,
    });
  }

  private async updateProjectFinancialStatus(projectId: string) {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });
    if (!project) return;

    let financialStatus: "on_track" | "warning" | "over_budget" | "excellent";

    if (project.spentAmount > project.totalBudget) {
      financialStatus = "over_budget";
    } else if (project.spentAmount > project.totalBudget * 0.9) {
      financialStatus = "warning";
    } else if (project.estimatedSavings > project.totalBudget * 0.1) {
      financialStatus = "excellent";
    } else {
      financialStatus = "on_track";
    }

    await this.projectRepository.update(projectId, {
      financialStatus,
    });
  }

  private async checkAndCreateBudgetAlerts(projectId: string) {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });
    if (!project) return;

    const utilizationPercentage =
      project.totalBudget > 0
        ? (project.spentAmount / project.totalBudget) * 100
        : 0;

    // Check for different alert thresholds
    if (utilizationPercentage >= 95) {
      await this.createBudgetAlert(
        projectId,
        AlertType.CRITICAL,
        95,
        utilizationPercentage
      );
    } else if (utilizationPercentage >= 85) {
      await this.createBudgetAlert(
        projectId,
        AlertType.WARNING,
        85,
        utilizationPercentage
      );
    }

    if (project.spentAmount > project.totalBudget) {
      await this.createBudgetAlert(
        projectId,
        AlertType.OVER_BUDGET,
        100,
        utilizationPercentage
      );
    }
  }

  private async createBudgetAlert(
    projectId: string,
    alertType: AlertType,
    thresholdPercentage: number,
    currentPercentage: number
  ) {
    const alert = this.alertRepository.create({
      projectId,
      alertType,
      thresholdPercentage,
      currentPercentage,
    });

    await this.alertRepository.save(alert);
  }

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
