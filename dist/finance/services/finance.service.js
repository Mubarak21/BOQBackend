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
const transaction_service_1 = require("./transaction.service");
const budget_management_service_1 = require("./budget-management.service");
const amount_utils_1 = require("../../utils/amount.utils");
let FinanceService = FinanceService_1 = class FinanceService {
    constructor(projectRepository, budgetCategoryRepository, transactionRepository, savingsRepository, alertRepository, transactionService, budgetManagementService) {
        this.projectRepository = projectRepository;
        this.budgetCategoryRepository = budgetCategoryRepository;
        this.transactionRepository = transactionRepository;
        this.savingsRepository = savingsRepository;
        this.alertRepository = alertRepository;
        this.transactionService = transactionService;
        this.budgetManagementService = budgetManagementService;
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
        await Promise.all(projects.map(async (project) => {
            try {
                await this.budgetManagementService.updateProjectSpentAmount(project.id);
            }
            catch (error) {
                this.logger.warn(`Failed to recalculate project ${project.id}: ${error.message}`);
            }
        }));
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
        const totalsQueryBuilder = this.projectRepository
            .createQueryBuilder("project")
            .select("SUM(COALESCE(project.totalBudget, 0))", "totalBudget")
            .addSelect("SUM(COALESCE(project.spentAmount, 0))", "totalSpent");
        if (search) {
            totalsQueryBuilder.andWhere("(project.title ILIKE :search OR project.description ILIKE :search)", { search: `%${search}%` });
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
        const totalBudget = totalsResult?.totalBudget ? parseFloat(totalsResult.totalBudget) : 0;
        const totalSpent = totalsResult?.totalSpent ? parseFloat(totalsResult.totalSpent) : 0;
        const totalRemaining = totalBudget - totalSpent;
        const normalizedRemaining = Math.max(Math.min(totalRemaining, 9999999999999.99), -9999999999999.99);
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
    async getProjectFinanceById(projectId, pagination) {
        const updatedSpentAmount = await this.budgetManagementService.updateProjectSpentAmount(projectId);
        const project = await this.projectRepository.findOne({
            where: { id: projectId },
            relations: ["owner", "collaborators"],
        });
        if (!project) {
            throw new common_1.NotFoundException("Project not found");
        }
        if (updatedSpentAmount !== undefined) {
            project.spentAmount = updatedSpentAmount;
        }
        return await this.transformToProjectFinanceDto(project, pagination);
    }
    async getFinanceMetrics() {
        return await this.calculateFinanceMetrics();
    }
    async getTransactions(query) {
        return this.transactionService.getTransactions(query);
    }
    async createTransaction(createTransactionDto, userId, invoiceFile) {
        return this.transactionService.createTransaction(createTransactionDto, userId, invoiceFile);
    }
    async updateTransaction(transactionId, updateTransactionDto, userId) {
        return this.transactionService.updateTransaction(transactionId, updateTransactionDto, userId);
    }
    async deleteTransaction(transactionId) {
        return this.transactionService.deleteTransaction(transactionId);
    }
    async updateProjectBudget(projectId, updateBudgetDto) {
        return this.budgetManagementService.updateProjectBudget(projectId, updateBudgetDto);
    }
    async transformToProjectFinanceDto(project, pagination) {
        const categories = await this.budgetCategoryRepository.find({
            where: { projectId: project.id, isActive: true },
        });
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
        }
        else {
            transactions = await this.transactionRepository.find({
                where: { projectId: project.id },
                relations: ["category", "creator"],
                order: { transactionDate: "DESC" },
                take: 50,
            });
            totalTransactions = transactions.length;
        }
        const savings = await this.savingsRepository.find({
            where: { projectId: project.id },
        });
        const totalBudget = (0, amount_utils_1.toNumber)(project.totalBudget);
        const spentAmount = (0, amount_utils_1.toNumber)(project.spentAmount);
        const allocatedBudget = (0, amount_utils_1.toNumber)(project.allocatedBudget);
        const remaining = totalBudget - spentAmount;
        const normalizedRemaining = Math.max(remaining, -9999999999999.99);
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
        const result = {
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
        try {
            const result = await this.projectRepository
                .createQueryBuilder("project")
                .select("COUNT(project.id)", "totalProjects")
                .addSelect("SUM(COALESCE(project.total_budget, 0))", "totalBudget")
                .addSelect("SUM(COALESCE(project.spent_amount, 0))", "totalSpent")
                .addSelect("SUM(COALESCE(project.estimated_savings, 0))", "totalSaved")
                .addSelect(`SUM(CASE WHEN COALESCE(project.spent_amount, 0) > COALESCE(project.total_budget, 0) THEN 1 ELSE 0 END)`, "projectsOverBudget")
                .addSelect(`SUM(CASE WHEN COALESCE(project.spent_amount, 0) < COALESCE(project.total_budget, 0) AND COALESCE(project.spent_amount, 0) > 0 THEN 1 ELSE 0 END)`, "projectsUnderBudget")
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
        }
        catch (error) {
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
    async recalculateAllProjectsSpentAmounts() {
        return await this.budgetManagementService.recalculateAllProjectsSpentAmounts();
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
        typeorm_2.Repository,
        transaction_service_1.TransactionService,
        budget_management_service_1.BudgetManagementService])
], FinanceService);
//# sourceMappingURL=finance.service.js.map