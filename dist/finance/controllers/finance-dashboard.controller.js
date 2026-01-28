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
exports.FinanceDashboardController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../auth/guards/roles.guard");
const roles_decorator_1 = require("../../auth/decorators/roles.decorator");
const user_entity_1 = require("../../entities/user.entity");
const finance_service_1 = require("../services/finance.service");
const inventory_service_1 = require("../../inventory/inventory.service");
const dashboard_service_1 = require("../../dashboard/dashboard.service");
const inventory_query_dto_1 = require("../../inventory/dto/inventory-query.dto");
const transaction_dto_1 = require("../dto/transaction.dto");
let FinanceDashboardController = class FinanceDashboardController {
    constructor(financeService, inventoryService, dashboardService) {
        this.financeService = financeService;
        this.inventoryService = inventoryService;
        this.dashboardService = dashboardService;
    }
    async getOverview(req) {
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
        }
        catch (error) {
            throw new common_1.HttpException({
                section: "overview",
                error: error.message || "Failed to fetch overview data",
                timestamp: new Date().toISOString(),
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getInventory(query, req) {
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
        }
        catch (error) {
            throw new common_1.HttpException({
                section: "inventory",
                error: error.message || "Failed to fetch inventory data",
                timestamp: new Date().toISOString(),
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getFinancial(transactionQuery, req) {
        try {
            const startTime = Date.now();
            const transactionParams = {
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
                    projectFinanceDetails = await this.financeService.getProjectFinanceById(transactionParams.projectId);
                }
                catch (error) {
                    console.warn(`Project ${transactionParams.projectId} not found:`, error.message);
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
        }
        catch (error) {
            throw new common_1.HttpException({
                section: "financial",
                error: error.message || "Failed to fetch financial data",
                timestamp: new Date().toISOString(),
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getReports(req) {
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
        }
        catch (error) {
            throw new common_1.HttpException({
                section: "reports",
                error: error.message || "Failed to fetch reports data",
                timestamp: new Date().toISOString(),
            }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.FinanceDashboardController = FinanceDashboardController;
__decorate([
    (0, common_1.Get)("overview"),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FinanceDashboardController.prototype, "getOverview", null);
__decorate([
    (0, common_1.Get)("inventory"),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_query_dto_1.InventoryQueryDto, Object]),
    __metadata("design:returntype", Promise)
], FinanceDashboardController.prototype, "getInventory", null);
__decorate([
    (0, common_1.Get)("financial"),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [transaction_dto_1.TransactionQueryDto, Object]),
    __metadata("design:returntype", Promise)
], FinanceDashboardController.prototype, "getFinancial", null);
__decorate([
    (0, common_1.Get)("reports"),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FinanceDashboardController.prototype, "getReports", null);
exports.FinanceDashboardController = FinanceDashboardController = __decorate([
    (0, common_1.Controller)("finance/dashboard"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.FINANCE, user_entity_1.UserRole.CONSULTANT),
    __metadata("design:paramtypes", [finance_service_1.FinanceService,
        inventory_service_1.InventoryService,
        dashboard_service_1.DashboardService])
], FinanceDashboardController);
//# sourceMappingURL=finance-dashboard.controller.js.map