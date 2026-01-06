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
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const project_transaction_entity_1 = require("../entities/project-transaction.entity");
const budget_category_entity_1 = require("../entities/budget-category.entity");
let AnalyticsService = class AnalyticsService {
    constructor(transactionRepository, budgetCategoryRepository) {
        this.transactionRepository = transactionRepository;
        this.budgetCategoryRepository = budgetCategoryRepository;
    }
    async getSpendingTrends(period, projectId, dateFrom, dateTo) {
        const queryBuilder = this.transactionRepository.createQueryBuilder("transaction");
        if (projectId) {
            queryBuilder.andWhere("transaction.projectId = :projectId", {
                projectId,
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
        let dateFormat;
        switch (period) {
            case "daily":
                dateFormat = "YYYY-MM-DD";
                break;
            case "weekly":
                dateFormat = 'YYYY-"W"WW';
                break;
            case "monthly":
                dateFormat = "YYYY-MM";
                break;
            case "yearly":
                dateFormat = "YYYY";
                break;
            default:
                dateFormat = "YYYY-MM";
        }
        const results = await queryBuilder
            .select([
            `TO_CHAR(transaction.transactionDate, '${dateFormat}') as period`,
            "SUM(transaction.amount) as amount",
            "COUNT(transaction.id) as count",
        ])
            .groupBy("period")
            .orderBy("period", "ASC")
            .getRawMany();
        return {
            trends: results.map((result) => ({
                period: result.period,
                amount: parseFloat(result.amount),
                budgeted: 0,
                variance: 0,
            })),
        };
    }
    async getCategoryBreakdown() {
        const categories = await this.budgetCategoryRepository
            .createQueryBuilder("category")
            .select([
            "category.name as category",
            "SUM(category.spentAmount) as amount",
            "SUM(category.budgetedAmount) as budgeted",
            "AVG(category.spentAmount / NULLIF(category.budgetedAmount, 0) * 100) as utilizationPercentage",
        ])
            .where("category.isActive = true")
            .groupBy("category.name")
            .getRawMany();
        const totalAmount = categories.reduce((sum, cat) => sum + parseFloat(cat.amount), 0);
        return {
            categories: categories.map((cat) => ({
                category: cat.category,
                amount: parseFloat(cat.amount),
                percentage: totalAmount > 0 ? (parseFloat(cat.amount) / totalAmount) * 100 : 0,
                budgeted: parseFloat(cat.budgeted),
                variance: parseFloat(cat.amount) - parseFloat(cat.budgeted),
            })),
        };
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(project_transaction_entity_1.ProjectTransaction)),
    __param(1, (0, typeorm_1.InjectRepository)(budget_category_entity_1.BudgetCategory)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map