"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const project_entity_1 = require("../../entities/project.entity");
const project_financial_summary_entity_1 = require("../../entities/project-financial-summary.entity");
const budget_category_entity_1 = require("../entities/budget-category.entity");
const project_transaction_entity_1 = require("../entities/project-transaction.entity");
const budget_alert_entity_1 = require("../entities/budget-alert.entity");
const budget_management_service_1 = require("./budget-management.service");
const amount_utils_1 = require("../../utils/amount.utils");
const fs = require("fs");
const path = require("path");
let TransactionService = class TransactionService {
    constructor(projectRepository, budgetCategoryRepository, transactionRepository, alertRepository, budgetManagementService, dataSource) {
        this.projectRepository = projectRepository;
        this.budgetCategoryRepository = budgetCategoryRepository;
        this.transactionRepository = transactionRepository;
        this.alertRepository = alertRepository;
        this.budgetManagementService = budgetManagementService;
        this.dataSource = dataSource;
    }
    async getTransactions(query) {
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
    async createTransaction(createTransactionDto, userId, invoiceFile) {
        const { projectId, categoryId, amount, type, description, vendor, transactionDate, } = createTransactionDto;
        const project = await this.projectRepository.findOne({
            where: { id: projectId },
        });
        if (!project) {
            throw new common_1.NotFoundException("Project not found");
        }
        let category = null;
        if (categoryId) {
            category = await this.budgetCategoryRepository.findOne({
                where: { id: categoryId },
            });
            if (!category) {
                throw new common_1.NotFoundException("Budget category not found");
            }
        }
        let invoiceUrl = null;
        let filePath = null;
        if (invoiceFile) {
            if (invoiceFile.mimetype !== 'application/pdf') {
                throw new common_1.BadRequestException("Invoice file must be a PDF");
            }
            if (invoiceFile.size > 10 * 1024 * 1024) {
                throw new common_1.BadRequestException("Invoice file is too large. Maximum size is 10MB");
            }
            const uploadDir = path.join(process.cwd(), "uploads", "transactions", "invoices");
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            const fileName = `${Date.now()}-${invoiceFile.originalname.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
            filePath = path.join(uploadDir, fileName);
            fs.writeFileSync(filePath, invoiceFile.buffer);
            invoiceUrl = `/uploads/transactions/invoices/${fileName}`;
        }
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const transactionNumber = await this.generateTransactionNumber();
            const transaction = queryRunner.manager.create(project_transaction_entity_1.ProjectTransaction, {
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
            const savedTransaction = await queryRunner.manager.save(project_transaction_entity_1.ProjectTransaction, transaction);
            if (categoryId) {
                await this.updateCategorySpentAmountInTransaction(categoryId, queryRunner);
            }
            await this.updateProjectSpentAmountInTransaction(projectId, queryRunner);
            await this.checkAndCreateBudgetAlertsInTransaction(projectId, queryRunner);
            await queryRunner.commitTransaction();
            return savedTransaction;
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            if (filePath && fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                }
                catch (fileError) {
                    console.error('Failed to clean up invoice file:', fileError);
                }
            }
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    async updateCategorySpentAmountInTransaction(categoryId, queryRunner) {
        const category = await queryRunner.manager.findOne(budget_category_entity_1.BudgetCategory, {
            where: { id: categoryId },
        });
        if (!category) {
            return;
        }
        const transactions = await queryRunner.manager.find(project_transaction_entity_1.ProjectTransaction, {
            where: { categoryId },
        });
        const totalSpent = transactions.reduce((sum, t) => {
            return sum + ((0, amount_utils_1.extractTransactionAmount)(t) || 0);
        }, 0);
        category.spentAmount = (0, amount_utils_1.validateAndNormalizeAmount)(totalSpent);
        await queryRunner.manager.save(budget_category_entity_1.BudgetCategory, category);
    }
    async updateProjectSpentAmountInTransaction(projectId, queryRunner) {
        const financialSummary = await queryRunner.manager.findOne(project_financial_summary_entity_1.ProjectFinancialSummary, {
            where: { project_id: projectId },
        });
        if (!financialSummary) {
            return;
        }
        const transactions = await queryRunner.manager.find(project_transaction_entity_1.ProjectTransaction, {
            where: { projectId },
        });
        const totalSpent = transactions.reduce((sum, t) => {
            return sum + ((0, amount_utils_1.extractTransactionAmount)(t) || 0);
        }, 0);
        financialSummary.spentAmount = (0, amount_utils_1.validateAndNormalizeAmount)(totalSpent);
        await queryRunner.manager.save(project_financial_summary_entity_1.ProjectFinancialSummary, financialSummary);
    }
    async checkAndCreateBudgetAlertsInTransaction(projectId, queryRunner) {
        const financialSummary = await queryRunner.manager.findOne(project_financial_summary_entity_1.ProjectFinancialSummary, {
            where: { project_id: projectId },
        });
        if (!financialSummary) {
            return;
        }
        const budgetUtilization = financialSummary.totalBudget > 0
            ? (financialSummary.spentAmount / financialSummary.totalBudget) * 100
            : 0;
        if (budgetUtilization >= 90) {
            const existingAlert = await queryRunner.manager.findOne(budget_alert_entity_1.BudgetAlert, {
                where: {
                    projectId,
                    alertType: budget_alert_entity_1.AlertType.OVER_BUDGET,
                },
            });
            if (!existingAlert) {
                const alert = queryRunner.manager.create(budget_alert_entity_1.BudgetAlert, {
                    projectId,
                    alertType: budget_alert_entity_1.AlertType.OVER_BUDGET,
                    thresholdPercentage: 90,
                    currentPercentage: budgetUtilization,
                });
                await queryRunner.manager.save(budget_alert_entity_1.BudgetAlert, alert);
            }
        }
    }
    async updateTransaction(transactionId, updateTransactionDto, userId) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const transaction = await queryRunner.manager.findOne(project_transaction_entity_1.ProjectTransaction, {
                where: { id: transactionId },
            });
            if (!transaction) {
                throw new common_1.NotFoundException("Transaction not found");
            }
            const oldProjectId = transaction.projectId;
            const oldCategoryId = transaction.categoryId;
            const oldAmount = transaction.amount;
            if (updateTransactionDto.projectId &&
                updateTransactionDto.projectId !== transaction.projectId) {
                const project = await queryRunner.manager.findOne(project_entity_1.Project, {
                    where: { id: updateTransactionDto.projectId },
                });
                if (!project) {
                    throw new common_1.NotFoundException("Project not found");
                }
            }
            if (updateTransactionDto.categoryId &&
                updateTransactionDto.categoryId !== transaction.categoryId) {
                const category = await queryRunner.manager.findOne(budget_category_entity_1.BudgetCategory, {
                    where: { id: updateTransactionDto.categoryId },
                });
                if (!category) {
                    throw new common_1.NotFoundException("Budget category not found");
                }
            }
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
                transaction.transactionDate = new Date(updateTransactionDto.transactionDate);
            }
            if (updateTransactionDto.invoiceNumber !== undefined) {
                transaction.invoiceNumber = updateTransactionDto.invoiceNumber;
            }
            if (updateTransactionDto.notes !== undefined) {
                transaction.notes = updateTransactionDto.notes;
            }
            const updatedTransaction = await queryRunner.manager.save(project_transaction_entity_1.ProjectTransaction, transaction);
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
            }
            else if (transaction.projectId === oldProjectId &&
                transaction.amount !== oldAmount) {
                await this.updateProjectSpentAmountInTransaction(transaction.projectId, queryRunner);
            }
            if (transaction.projectId) {
                await this.checkAndCreateBudgetAlertsInTransaction(transaction.projectId, queryRunner);
            }
            await queryRunner.commitTransaction();
            return updatedTransaction;
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    async deleteTransaction(transactionId) {
        const transaction = await this.transactionRepository.findOne({
            where: { id: transactionId },
        });
        if (!transaction) {
            throw new common_1.NotFoundException("Transaction not found");
        }
        const projectId = transaction.projectId;
        const categoryId = transaction.categoryId;
        await this.transactionRepository.remove(transaction);
        if (categoryId) {
            await this.budgetManagementService.updateCategorySpentAmount(categoryId);
        }
        if (projectId) {
            await this.budgetManagementService.updateProjectSpentAmount(projectId);
            await this.budgetManagementService.checkAndCreateBudgetAlerts(projectId);
        }
        return { success: true, message: "Transaction deleted successfully" };
    }
    async generateTransactionNumber() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        const prefix = `TXN${year}${month}${day}`;
        const lastTransaction = await this.transactionRepository
            .createQueryBuilder("transaction")
            .where("transaction.transactionNumber LIKE :prefix", {
            prefix: `${prefix}%`,
        })
            .orderBy("transaction.transactionNumber", "DESC")
            .getOne();
        let sequence = 1;
        if (lastTransaction) {
            const lastSequence = parseInt(lastTransaction.transactionNumber.substr(-4));
            sequence = lastSequence + 1;
        }
        return `${prefix}${String(sequence).padStart(4, "0")}`;
    }
};
exports.TransactionService = TransactionService;
exports.TransactionService = TransactionService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __param(1, (0, typeorm_1.InjectRepository)(budget_category_entity_1.BudgetCategory)),
    __param(2, (0, typeorm_1.InjectRepository)(project_transaction_entity_1.ProjectTransaction)),
    __param(3, (0, typeorm_1.InjectRepository)(budget_alert_entity_1.BudgetAlert)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        budget_management_service_1.BudgetManagementService,
        typeorm_2.DataSource])
], TransactionService);
//# sourceMappingURL=transaction.service.js.map