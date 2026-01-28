import {
  Injectable,
  NotFoundException,
  forwardRef,
  Inject,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { Project } from "../../entities/project.entity";
import { ProjectFinancialSummary } from "../../entities/project-financial-summary.entity";
import { BudgetCategory } from "../entities/budget-category.entity";
import { ProjectTransaction } from "../entities/project-transaction.entity";
import { BudgetAlert, AlertType } from "../entities/budget-alert.entity";
import {
  CreateTransactionDto,
  UpdateTransactionDto,
  TransactionQueryDto,
} from "../dto/transaction.dto";
import { BudgetManagementService } from "./budget-management.service";
import { extractTransactionAmount, validateAndNormalizeAmount } from "../../utils/amount.utils";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(BudgetCategory)
    private readonly budgetCategoryRepository: Repository<BudgetCategory>,
    @InjectRepository(ProjectTransaction)
    private readonly transactionRepository: Repository<ProjectTransaction>,
    @InjectRepository(BudgetAlert)
    private readonly alertRepository: Repository<BudgetAlert>,
    private readonly budgetManagementService: BudgetManagementService,
    private readonly dataSource: DataSource
  ) {}

  /**
   * Get transactions with filters and pagination
   */
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

  /**
   * Create a new transaction
   */
  async createTransaction(
    createTransactionDto: CreateTransactionDto,
    userId: string,
    invoiceFile?: Express.Multer.File
  ) {
    const {
      projectId,
      categoryId,
      amount,
      type,
      description,
      vendor,
      transactionDate,
    } = createTransactionDto;

    // Verify project exists
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException("Project not found");
    }

    // Verify category exists (if provided)
    let category = null;
    if (categoryId) {
      category = await this.budgetCategoryRepository.findOne({
        where: { id: categoryId },
      });
      if (!category) {
        throw new NotFoundException("Budget category not found");
      }
    }

    // Handle invoice file upload (if provided) - outside transaction
    let invoiceUrl: string | null = null;
    let filePath: string | null = null;
    if (invoiceFile) {
      // Validate file type (PDF only)
      if (invoiceFile.mimetype !== 'application/pdf') {
        throw new BadRequestException("Invoice file must be a PDF");
      }

      // Validate file size (10MB max)
      if (invoiceFile.size > 10 * 1024 * 1024) {
        throw new BadRequestException("Invoice file is too large. Maximum size is 10MB");
      }

      const uploadDir = path.join(
        process.cwd(),
        "uploads",
        "transactions",
        "invoices"
      );
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const fileName = `${Date.now()}-${invoiceFile.originalname.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, invoiceFile.buffer);
      invoiceUrl = `/uploads/transactions/invoices/${fileName}`;
    }

    // Use QueryRunner for transaction management
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Generate transaction number
      const transactionNumber = await this.generateTransactionNumber();

      // Create transaction
      const transaction = queryRunner.manager.create(ProjectTransaction, {
        projectId,
        categoryId: categoryId || null,
        transactionNumber,
        amount,
        type,
        description,
        vendor,
        transactionDate: new Date(transactionDate),
        createdBy: userId,
      });

      const savedTransaction = await queryRunner.manager.save(ProjectTransaction, transaction);

      // Update category spent amount within transaction (if category exists)
      if (categoryId) {
        await this.updateCategorySpentAmountInTransaction(categoryId, queryRunner);
      }

      // Update project spent amount within transaction
      await this.updateProjectSpentAmountInTransaction(projectId, queryRunner);

      // Check and create budget alerts within transaction
      await this.checkAndCreateBudgetAlertsInTransaction(projectId, queryRunner);

      await queryRunner.commitTransaction();
      return savedTransaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      
      // Clean up file if created
      if (filePath && fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (fileError) {
          console.error('Failed to clean up invoice file:', fileError);
        }
      }
      
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // Helper method to update category spent amount within transaction
  private async updateCategorySpentAmountInTransaction(
    categoryId: string,
    queryRunner: any
  ) {
    const category = await queryRunner.manager.findOne(BudgetCategory, {
      where: { id: categoryId },
    });

    if (!category) {
      return;
    }

    // Calculate total spent from all transactions in this category
    const transactions = await queryRunner.manager.find(ProjectTransaction, {
      where: { categoryId },
    });

    const totalSpent = transactions.reduce((sum: number, t: ProjectTransaction) => {
      return sum + (extractTransactionAmount(t) || 0);
    }, 0);

    category.spentAmount = validateAndNormalizeAmount(totalSpent);
    await queryRunner.manager.save(BudgetCategory, category);
  }

  // Helper method to update project spent amount within transaction
  private async updateProjectSpentAmountInTransaction(
    projectId: string,
    queryRunner: any
  ) {
    const financialSummary = await queryRunner.manager.findOne(ProjectFinancialSummary, {
      where: { project_id: projectId },
    });

    if (!financialSummary) {
      return;
    }

    // Calculate total spent from all transactions for this project
    const transactions = await queryRunner.manager.find(ProjectTransaction, {
      where: { projectId },
    });

    const totalSpent = transactions.reduce((sum: number, t: ProjectTransaction) => {
      return sum + (extractTransactionAmount(t) || 0);
    }, 0);

    financialSummary.spentAmount = validateAndNormalizeAmount(totalSpent);
    await queryRunner.manager.save(ProjectFinancialSummary, financialSummary);
  }

  // Helper method to check and create budget alerts within transaction
  private async checkAndCreateBudgetAlertsInTransaction(
    projectId: string,
    queryRunner: any
  ) {
    const financialSummary = await queryRunner.manager.findOne(ProjectFinancialSummary, {
      where: { project_id: projectId },
    });

    if (!financialSummary) {
      return;
    }

    const budgetUtilization = financialSummary.totalBudget > 0
      ? (financialSummary.spentAmount / financialSummary.totalBudget) * 100
      : 0;

    // Check thresholds and create alerts
    if (budgetUtilization >= 90) {
      const existingAlert = await queryRunner.manager.findOne(BudgetAlert, {
        where: {
          projectId,
          alertType: AlertType.OVER_BUDGET,
        },
      });

      if (!existingAlert) {
        const alert = queryRunner.manager.create(BudgetAlert, {
          projectId,
          alertType: AlertType.OVER_BUDGET,
          thresholdPercentage: 90,
          currentPercentage: budgetUtilization,
        });
        await queryRunner.manager.save(BudgetAlert, alert);
      }
    }
  }

  /**
   * Update an existing transaction
   */
  async updateTransaction(
    transactionId: string,
    updateTransactionDto: UpdateTransactionDto,
    userId: string
  ) {
    // Use QueryRunner for transaction management
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const transaction = await queryRunner.manager.findOne(ProjectTransaction, {
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
        const project = await queryRunner.manager.findOne(Project, {
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
        const category = await queryRunner.manager.findOne(BudgetCategory, {
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
      if (updateTransactionDto.notes !== undefined) {
        transaction.notes = updateTransactionDto.notes;
      }

      const updatedTransaction = await queryRunner.manager.save(ProjectTransaction, transaction);

      // Update spent amounts for old and new categories/projects if changed
      if (oldCategoryId) {
        await this.updateCategorySpentAmountInTransaction(oldCategoryId, queryRunner);
      }
      if (oldProjectId) {
        await this.updateProjectSpentAmountInTransaction(oldProjectId, queryRunner);
      }

      if (transaction.categoryId && transaction.categoryId !== oldCategoryId) {
        await this.updateCategorySpentAmountInTransaction(transaction.categoryId, queryRunner);
      }
      if (transaction.projectId && transaction.projectId !== oldProjectId) {
        await this.updateProjectSpentAmountInTransaction(transaction.projectId, queryRunner);
      } else if (
        transaction.projectId === oldProjectId &&
        transaction.amount !== oldAmount
      ) {
        // Amount changed but project didn't, still need to update
        await this.updateProjectSpentAmountInTransaction(transaction.projectId, queryRunner);
      }

      // Check for budget alerts
      if (transaction.projectId) {
        await this.checkAndCreateBudgetAlertsInTransaction(transaction.projectId, queryRunner);
      }

      await queryRunner.commitTransaction();
      return updatedTransaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Delete a transaction
   */
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
      await this.budgetManagementService.updateCategorySpentAmount(categoryId);
    }
    if (projectId) {
      await this.budgetManagementService.updateProjectSpentAmount(projectId);
      await this.budgetManagementService.checkAndCreateBudgetAlerts(projectId);
    }



    return { success: true, message: "Transaction deleted successfully" };
  }

  /**
   * Generate unique transaction number
   */
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
}

