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
exports.BudgetManagementService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const project_entity_1 = require("../../entities/project.entity");
const project_financial_summary_entity_1 = require("../../entities/project-financial-summary.entity");
const budget_category_entity_1 = require("../entities/budget-category.entity");
const project_transaction_entity_1 = require("../entities/project-transaction.entity");
const budget_alert_entity_1 = require("../entities/budget-alert.entity");
const amount_utils_1 = require("../../utils/amount.utils");
let BudgetManagementService = class BudgetManagementService {
    constructor(projectRepository, financialSummaryRepository, budgetCategoryRepository, transactionRepository, alertRepository, dataSource) {
        this.projectRepository = projectRepository;
        this.financialSummaryRepository = financialSummaryRepository;
        this.budgetCategoryRepository = budgetCategoryRepository;
        this.transactionRepository = transactionRepository;
        this.alertRepository = alertRepository;
        this.dataSource = dataSource;
    }
    async updateProjectBudget(projectId, updateBudgetDto) {
        const { totalBudget, categories } = updateBudgetDto;
        const project = await this.projectRepository.findOne({
            where: { id: projectId },
            relations: ["financialSummary"],
        });
        if (!project) {
            throw new common_1.NotFoundException("Project not found");
        }
        let financialSummary = project.financialSummary;
        if (!financialSummary) {
            financialSummary = this.financialSummaryRepository.create({
                project_id: projectId,
                totalBudget: totalBudget,
                budgetLastUpdated: new Date(),
            });
            await this.financialSummaryRepository.save(financialSummary);
        }
        else {
            financialSummary.totalBudget = totalBudget;
            financialSummary.budgetLastUpdated = new Date();
            await this.financialSummaryRepository.save(financialSummary);
        }
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
    async updateCategorySpentAmount(categoryId) {
        const category = await this.budgetCategoryRepository.findOne({
            where: { id: categoryId },
            select: ['id', 'projectId'],
        });
        if (!category) {
            return;
        }
        const transactions = await this.transactionRepository.find({
            where: { categoryId },
        });
        const validTransactions = transactions.filter(t => {
            if (t.projectId !== category.projectId) {
                return false;
            }
            return true;
        });
        const totalSpent = (0, amount_utils_1.sumAmounts)(validTransactions);
        const normalizedSpent = (0, amount_utils_1.validateAndNormalizeAmount)(totalSpent, 9999999999999.99, 2);
        await this.budgetCategoryRepository.update(categoryId, {
            spentAmount: normalizedSpent,
        });
    }
    async updateProjectSpentAmount(projectId) {
        const transactions = await this.transactionRepository.find({
            where: { projectId },
        });
        const validTransactions = transactions.filter(t => {
            if (t.projectId !== projectId) {
                return false;
            }
            return true;
        });
        const totalSpent = (0, amount_utils_1.sumAmounts)(validTransactions);
        const normalizedSpent = (0, amount_utils_1.validateAndNormalizeAmount)(totalSpent, 9999999999999.99, 2);
        const project = await this.projectRepository.findOne({
            where: { id: projectId },
            relations: ["financialSummary"],
        });
        if (!project) {
            throw new common_1.NotFoundException("Project not found");
        }
        let financialSummary = project.financialSummary;
        if (!financialSummary) {
            financialSummary = this.financialSummaryRepository.create({
                project_id: projectId,
                spentAmount: normalizedSpent,
            });
            await this.financialSummaryRepository.save(financialSummary);
        }
        else {
            financialSummary.spentAmount = normalizedSpent;
            await this.financialSummaryRepository.save(financialSummary);
        }
        return normalizedSpent;
    }
    async updateProjectAllocatedBudget(projectId) {
        const categories = await this.budgetCategoryRepository.find({
            where: { projectId, isActive: true },
        });
        const totalAllocated = categories.reduce((sum, c) => sum + c.budgetedAmount, 0);
        const project = await this.projectRepository.findOne({
            where: { id: projectId },
            relations: ["financialSummary"],
        });
        if (!project) {
            throw new common_1.NotFoundException("Project not found");
        }
        let financialSummary = project.financialSummary;
        if (!financialSummary) {
            financialSummary = this.financialSummaryRepository.create({
                project_id: projectId,
                allocatedBudget: totalAllocated,
            });
            await this.financialSummaryRepository.save(financialSummary);
        }
        else {
            financialSummary.allocatedBudget = totalAllocated;
            await this.financialSummaryRepository.save(financialSummary);
        }
    }
    async updateProjectFinancialStatus(projectId) {
        const project = await this.projectRepository.findOne({
            where: { id: projectId },
            relations: ["financialSummary"],
        });
        if (!project)
            return;
        const financialSummary = project.financialSummary;
        if (!financialSummary)
            return;
        let financialStatus;
        if (financialSummary.spentAmount > financialSummary.totalBudget) {
            financialStatus = "over_budget";
        }
        else if (financialSummary.spentAmount > financialSummary.totalBudget * 0.9) {
            financialStatus = "warning";
        }
        else if (financialSummary.estimatedSavings > financialSummary.totalBudget * 0.1) {
            financialStatus = "excellent";
        }
        else {
            financialStatus = "on_track";
        }
        financialSummary.financialStatus = financialStatus;
        await this.financialSummaryRepository.save(financialSummary);
    }
    async checkAndCreateBudgetAlerts(projectId) {
        const project = await this.projectRepository.findOne({
            where: { id: projectId },
            relations: ["financialSummary"],
        });
        if (!project || !project.financialSummary)
            return;
        const financialSummary = project.financialSummary;
        const totalBudget = typeof financialSummary.totalBudget === 'number'
            ? financialSummary.totalBudget
            : parseFloat(String(financialSummary.totalBudget || 0)) || 0;
        const spentAmount = typeof financialSummary.spentAmount === 'number'
            ? financialSummary.spentAmount
            : parseFloat(String(financialSummary.spentAmount || 0)) || 0;
        let utilizationPercentage = 0;
        if (totalBudget > 0) {
            utilizationPercentage = (spentAmount / totalBudget) * 100;
        }
        utilizationPercentage = Math.min(Math.max(utilizationPercentage, 0), 999.99);
        utilizationPercentage = Math.round(utilizationPercentage * 100) / 100;
        if (utilizationPercentage >= 95) {
            await this.createBudgetAlert(projectId, budget_alert_entity_1.AlertType.CRITICAL, 95, utilizationPercentage);
        }
        else if (utilizationPercentage >= 85) {
            await this.createBudgetAlert(projectId, budget_alert_entity_1.AlertType.WARNING, 85, utilizationPercentage);
        }
        if (spentAmount > totalBudget) {
            await this.createBudgetAlert(projectId, budget_alert_entity_1.AlertType.OVER_BUDGET, 100, utilizationPercentage);
        }
    }
    async createBudgetAlert(projectId, alertType, thresholdPercentage, currentPercentage) {
        const normalizedThreshold = Math.min(Math.max(typeof thresholdPercentage === 'number' ? thresholdPercentage : parseFloat(String(thresholdPercentage || 0)) || 0, 0), 999.99);
        const normalizedCurrent = Math.min(Math.max(typeof currentPercentage === 'number' ? currentPercentage : parseFloat(String(currentPercentage || 0)) || 0, 0), 999.99);
        const threshold = Math.round(normalizedThreshold * 100) / 100;
        const current = Math.round(normalizedCurrent * 100) / 100;
        const existingAlert = await this.alertRepository.findOne({
            where: {
                projectId,
                alertType,
                isActive: true,
            },
        });
        if (existingAlert) {
            existingAlert.thresholdPercentage = threshold;
            existingAlert.currentPercentage = current;
            existingAlert.triggeredAt = new Date();
            await this.alertRepository.save(existingAlert);
        }
        else {
            const alert = this.alertRepository.create({
                projectId,
                alertType,
                thresholdPercentage: threshold,
                currentPercentage: current,
                isActive: true,
                triggeredAt: new Date(),
            });
            await this.alertRepository.save(alert);
        }
    }
    async recalculateAllCategoriesSpentAmounts() {
        const errors = [];
        let fixed = 0;
        try {
            const categories = await this.budgetCategoryRepository.find({
                select: ['id'],
            });
            for (const category of categories) {
                try {
                    await this.updateCategorySpentAmount(category.id);
                    fixed++;
                }
                catch (error) {
                    errors.push(`Category ${category.id}: ${error.message}`);
                }
            }
        }
        catch (error) {
            errors.push(`Failed to recalculate categories: ${error.message}`);
        }
        return { fixed, errors };
    }
    async recalculateAllProjectsSpentAmounts() {
        const errors = [];
        let fixed = 0;
        try {
            const categoryResult = await this.recalculateAllCategoriesSpentAmounts();
            const projects = await this.projectRepository.find({
                select: ['id'],
            });
            for (const project of projects) {
                try {
                    await this.updateProjectSpentAmount(project.id);
                    fixed++;
                }
                catch (error) {
                    errors.push(`Project ${project.id}: ${error.message}`);
                }
            }
            errors.push(...categoryResult.errors);
        }
        catch (error) {
            errors.push(`Failed to recalculate: ${error.message}`);
        }
        return { fixed, errors };
    }
};
exports.BudgetManagementService = BudgetManagementService;
exports.BudgetManagementService = BudgetManagementService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __param(1, (0, typeorm_1.InjectRepository)(project_financial_summary_entity_1.ProjectFinancialSummary)),
    __param(2, (0, typeorm_1.InjectRepository)(budget_category_entity_1.BudgetCategory)),
    __param(3, (0, typeorm_1.InjectRepository)(project_transaction_entity_1.ProjectTransaction)),
    __param(4, (0, typeorm_1.InjectRepository)(budget_alert_entity_1.BudgetAlert)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], BudgetManagementService);
//# sourceMappingURL=budget-management.service.js.map