import {
  Injectable,
  NotFoundException,
  forwardRef,
  Inject,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Project } from "../../entities/project.entity";
import { BudgetCategory } from "../entities/budget-category.entity";
import { ProjectTransaction } from "../entities/project-transaction.entity";
import { BudgetAlert, AlertType } from "../entities/budget-alert.entity";
import {
  CreateTransactionDto,
  UpdateTransactionDto,
  TransactionQueryDto,
} from "../dto/transaction.dto";
import { BudgetManagementService } from "./budget-management.service";
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
    private readonly budgetManagementService: BudgetManagementService
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
      receiptUrl,
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

    // Handle invoice file upload (if provided)
    let invoiceUrl: string | null = receiptUrl || null;
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
      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, invoiceFile.buffer);
      invoiceUrl = `/uploads/transactions/invoices/${fileName}`;
    }

    // Generate transaction number
    const transactionNumber = await this.generateTransactionNumber();

    // Create transaction
    const transaction = this.transactionRepository.create({
      projectId,
      categoryId: categoryId || null,
      transactionNumber,
      amount,
      type,
      description,
      vendor,
      transactionDate: new Date(transactionDate),
      receiptUrl: invoiceUrl,
      createdBy: userId,
    });

    const savedTransaction = await this.transactionRepository.save(transaction);

    console.log(`💳 [Transaction] New transaction created: ${savedTransaction.transactionNumber} - Amount: ${savedTransaction.amount} TSh - Type: ${savedTransaction.type}`);
    console.log(`💳 [Transaction] Recalculating finance for project: ${projectId}`);

    // Recalculate category spent amount (if category exists)
    if (categoryId) {
      await this.budgetManagementService.updateCategorySpentAmount(categoryId);
    }

    // Recalculate project spent amount from all transactions (ensures accuracy)
    await this.budgetManagementService.updateProjectSpentAmount(projectId);

    // Check for budget alerts
    await this.budgetManagementService.checkAndCreateBudgetAlerts(projectId);

    console.log(`✅ [Transaction] Finance recalculation completed for transaction ${savedTransaction.transactionNumber}`);

    return savedTransaction;
  }

  /**
   * Update an existing transaction
   */
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
      await this.budgetManagementService.updateCategorySpentAmount(oldCategoryId);
    }
    if (oldProjectId) {
      await this.budgetManagementService.updateProjectSpentAmount(oldProjectId);
    }

    if (transaction.categoryId && transaction.categoryId !== oldCategoryId) {
      await this.budgetManagementService.updateCategorySpentAmount(transaction.categoryId);
    }
    if (transaction.projectId && transaction.projectId !== oldProjectId) {
      await this.budgetManagementService.updateProjectSpentAmount(transaction.projectId);
    } else if (
      transaction.projectId === oldProjectId &&
      transaction.amount !== oldAmount
    ) {
      // Amount changed but project didn't, still need to update
      await this.budgetManagementService.updateProjectSpentAmount(transaction.projectId);
    }

    // Check for budget alerts
    if (transaction.projectId) {
      await this.budgetManagementService.checkAndCreateBudgetAlerts(transaction.projectId);
    }

    console.log(`✅ [Transaction] Finance recalculation completed for transaction ${updatedTransaction.transactionNumber}`);

    return updatedTransaction;
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

    console.log(`💳 [Transaction] Transaction deleted: ${transaction.transactionNumber} - Amount: ${transaction.amount} TSh`);
    console.log(`💳 [Transaction] Recalculating finance for project: ${projectId}`);

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

    console.log(`✅ [Transaction] Finance recalculation completed after deleting transaction ${transaction.transactionNumber}`);

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

