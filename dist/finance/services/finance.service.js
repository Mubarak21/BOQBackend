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
var FinanceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinanceService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const project_entity_1 = require("../../entities/project.entity");
const budget_category_entity_1 = require("../entities/budget-category.entity");
const project_transaction_entity_1 = require("../entities/project-transaction.entity");
const project_savings_entity_1 = require("../entities/project-savings.entity");
const budget_alert_entity_1 = require("../entities/budget-alert.entity");
let FinanceService = FinanceService_1 = class FinanceService {
    constructor(projectRepository, budgetCategoryRepository, transactionRepository, savingsRepository, alertRepository) {
        this.projectRepository = projectRepository;
        this.budgetCategoryRepository = budgetCategoryRepository;
        this.transactionRepository = transactionRepository;
        this.savingsRepository = savingsRepository;
        this.alertRepository = alertRepository;
        this.logger = new common_1.Logger(FinanceService_1.name);
    }
    async getProjectsFinance(query) {
        const { page = 1, limit = 10, search, status, dateFrom, dateTo, budgetMin, budgetMax, savingsMin, savingsMax, } = query;
        const queryBuilder = this.projectRepository
            .createQueryBuilder("project")
            .leftJoinAndSelect("project.owner", "owner")
            .leftJoinAndSelect("project.collaborators", "collaborators");
        if (search) {
            queryBuilder.andWhere("(project.title ILIKE :search OR project.description ILIKE :search)", {
                search: `%${search}%`,
            });
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
        const pageNum = Number(page) || 1;
        const limitNum = Number(limit) || 10;
        const offset = (pageNum - 1) * limitNum;
        queryBuilder.skip(offset).take(limitNum);
        const [projects, total] = await queryBuilder.getManyAndCount();
        const projectFinances = await Promise.all(projects.map(async (project) => await this.transformToProjectFinanceDto(project)));
        let filteredProjects = projectFinances;
        if (savingsMin !== undefined || savingsMax !== undefined) {
            filteredProjects = projectFinances.filter((p) => {
                const savingsPercentage = p.savings.percentage;
                return ((savingsMin === undefined || savingsPercentage >= savingsMin) &&
                    (savingsMax === undefined || savingsPercentage <= savingsMax));
            });
        }
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
    async getProjectFinanceById(projectId) {
        const project = await this.projectRepository.findOne({
            where: { id: projectId },
            relations: ["owner", "collaborators"],
        });
        if (!project) {
            throw new common_1.NotFoundException("Project not found");
        }
        return await this.transformToProjectFinanceDto(project);
    }
    async getFinanceMetrics() {
        return await this.calculateFinanceMetrics();
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
    async createTransaction(createTransactionDto, userId) {
        const { projectId, categoryId, amount, type, description, vendor, transactionDate, receiptUrl, } = createTransactionDto;
        const project = await this.projectRepository.findOne({
            where: { id: projectId },
        });
        if (!project) {
            throw new common_1.NotFoundException("Project not found");
        }
        const category = await this.budgetCategoryRepository.findOne({
            where: { id: categoryId },
        });
        if (!category) {
            throw new common_1.NotFoundException("Budget category not found");
        }
        const transactionNumber = await this.generateTransactionNumber();
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
        await this.updateCategorySpentAmount(categoryId);
        await this.updateProjectSpentAmount(projectId);
        await this.checkAndCreateBudgetAlerts(projectId);
        return savedTransaction;
    }
    async updateTransaction(transactionId, updateTransactionDto, userId) {
        const transaction = await this.transactionRepository.findOne({
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
            const project = await this.projectRepository.findOne({
                where: { id: updateTransactionDto.projectId },
            });
            if (!project) {
                throw new common_1.NotFoundException("Project not found");
            }
        }
        if (updateTransactionDto.categoryId &&
            updateTransactionDto.categoryId !== transaction.categoryId) {
            const category = await this.budgetCategoryRepository.findOne({
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
        if (updateTransactionDto.receiptUrl !== undefined) {
            transaction.receiptUrl = updateTransactionDto.receiptUrl;
        }
        if (updateTransactionDto.notes !== undefined) {
            transaction.notes = updateTransactionDto.notes;
        }
        const updatedTransaction = await this.transactionRepository.save(transaction);
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
        }
        else if (transaction.projectId === oldProjectId &&
            transaction.amount !== oldAmount) {
            await this.updateProjectSpentAmount(transaction.projectId);
        }
        if (transaction.projectId) {
            await this.checkAndCreateBudgetAlerts(transaction.projectId);
        }
        return updatedTransaction;
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
            await this.updateCategorySpentAmount(categoryId);
        }
        if (projectId) {
            await this.updateProjectSpentAmount(projectId);
            await this.checkAndCreateBudgetAlerts(projectId);
        }
        return { success: true, message: "Transaction deleted successfully" };
    }
    async updateProjectBudget(projectId, updateBudgetDto) {
        const { totalBudget, categories } = updateBudgetDto;
        const project = await this.projectRepository.findOne({
            where: { id: projectId },
        });
        if (!project) {
            throw new common_1.NotFoundException("Project not found");
        }
        project.totalBudget = totalBudget;
        project.budgetLastUpdated = new Date();
        await this.projectRepository.save(project);
        for (const categoryUpdate of categories) {
            const category = await this.budgetCategoryRepository.findOne({
                where: { id: categoryUpdate.categoryId },
            });
            if (category) {
                category.budgetedAmount = categoryUpdate.budgetedAmount;
                await this.budgetCategoryRepository.save(category);
            }
        }
        await this.updateProjectAllocatedBudget(projectId);
        await this.updateProjectFinancialStatus(projectId);
        return { success: true };
    }
    async transformToProjectFinanceDto(project) {
        const categories = await this.budgetCategoryRepository.find({
            where: { projectId: project.id, isActive: true },
        });
        const transactions = await this.transactionRepository.find({
            where: { projectId: project.id },
            relations: ["category", "creator"],
            order: { transactionDate: "DESC" },
            take: 50,
        });
        const savings = await this.savingsRepository.find({
            where: { projectId: project.id },
        });
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
            percentage: project.totalBudget > 0
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
    formatDateToISOString(date) {
        if (!date) {
            return "";
        }
        if (typeof date === "string") {
            const parsedDate = new Date(date);
            if (isNaN(parsedDate.getTime())) {
                return date;
            }
            return parsedDate.toISOString();
        }
        if (date instanceof Date) {
            return date.toISOString();
        }
        return "";
    }
    async calculateFinanceMetrics() {
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
        const avgSavingsPercentage = totalBudget > 0 ? (totalSaved / totalBudget) * 100 : 0;
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
    async calculateMonthlySpending(projectId) {
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
    async updateCategorySpentAmount(categoryId) {
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
    async updateProjectSpentAmount(projectId) {
        const categories = await this.budgetCategoryRepository.find({
            where: { projectId },
        });
        const totalSpent = categories.reduce((sum, c) => sum + c.spentAmount, 0);
        await this.projectRepository.update(projectId, {
            spentAmount: totalSpent,
        });
    }
    async updateProjectAllocatedBudget(projectId) {
        const categories = await this.budgetCategoryRepository.find({
            where: { projectId, isActive: true },
        });
        const totalAllocated = categories.reduce((sum, c) => sum + c.budgetedAmount, 0);
        await this.projectRepository.update(projectId, {
            allocatedBudget: totalAllocated,
        });
    }
    async updateProjectFinancialStatus(projectId) {
        const project = await this.projectRepository.findOne({
            where: { id: projectId },
        });
        if (!project)
            return;
        let financialStatus;
        if (project.spentAmount > project.totalBudget) {
            financialStatus = "over_budget";
        }
        else if (project.spentAmount > project.totalBudget * 0.9) {
            financialStatus = "warning";
        }
        else if (project.estimatedSavings > project.totalBudget * 0.1) {
            financialStatus = "excellent";
        }
        else {
            financialStatus = "on_track";
        }
        await this.projectRepository.update(projectId, {
            financialStatus,
        });
    }
    async checkAndCreateBudgetAlerts(projectId) {
        const project = await this.projectRepository.findOne({
            where: { id: projectId },
        });
        if (!project)
            return;
        const utilizationPercentage = project.totalBudget > 0
            ? (project.spentAmount / project.totalBudget) * 100
            : 0;
        if (utilizationPercentage >= 95) {
            await this.createBudgetAlert(projectId, budget_alert_entity_1.AlertType.CRITICAL, 95, utilizationPercentage);
        }
        else if (utilizationPercentage >= 85) {
            await this.createBudgetAlert(projectId, budget_alert_entity_1.AlertType.WARNING, 85, utilizationPercentage);
        }
        if (project.spentAmount > project.totalBudget) {
            await this.createBudgetAlert(projectId, budget_alert_entity_1.AlertType.OVER_BUDGET, 100, utilizationPercentage);
        }
    }
    async createBudgetAlert(projectId, alertType, thresholdPercentage, currentPercentage) {
        const alert = this.alertRepository.create({
            projectId,
            alertType,
            thresholdPercentage,
            currentPercentage,
        });
        await this.alertRepository.save(alert);
    }
    async getAdminFinancialMetrics() {
        const [totalProjects, totalBudget, totalSpent, totalSaved] = await Promise.all([
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
        const avgSavingsPercentage = totalBudget > 0 ? (totalSaved / totalBudget) * 100 : 0;
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
};
exports.FinanceService = FinanceService;
exports.FinanceService = FinanceService = FinanceService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __param(1, (0, typeorm_1.InjectRepository)(budget_category_entity_1.BudgetCategory)),
    __param(2, (0, typeorm_1.InjectRepository)(project_transaction_entity_1.ProjectTransaction)),
    __param(3, (0, typeorm_1.InjectRepository)(project_savings_entity_1.ProjectSavings)),
    __param(4, (0, typeorm_1.InjectRepository)(budget_alert_entity_1.BudgetAlert)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], FinanceService);
//# sourceMappingURL=finance.service.js.map