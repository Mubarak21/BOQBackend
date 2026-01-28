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
exports.FinanceController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../auth/guards/roles.guard");
const roles_decorator_1 = require("../../auth/decorators/roles.decorator");
const user_entity_1 = require("../../entities/user.entity");
const finance_service_1 = require("../services/finance.service");
const analytics_service_1 = require("../services/analytics.service");
const project_finance_query_dto_1 = require("../dto/project-finance-query.dto");
const transaction_dto_1 = require("../dto/transaction.dto");
const budget_update_dto_1 = require("../dto/budget-update.dto");
const generate_report_dto_1 = require("../dto/generate-report.dto");
const finance_report_generator_service_1 = require("../services/finance-report-generator.service");
const common_2 = require("@nestjs/common");
const fs = require("fs");
const path = require("path");
let FinanceController = class FinanceController {
    constructor(financeService, analyticsService, reportGeneratorService) {
        this.financeService = financeService;
        this.analyticsService = analyticsService;
        this.reportGeneratorService = reportGeneratorService;
    }
    async getProjectsFinance(query) {
        return await this.financeService.getProjectsFinance(query);
    }
    async getProjectFinance(id, page = 1, limit = 10) {
        return await this.financeService.getProjectFinanceById(id, { page, limit });
    }
    async getFinanceMetrics() {
        return await this.financeService.getFinanceMetrics();
    }
    async getTransactions(query) {
        return await this.financeService.getTransactions(query);
    }
    async createTransaction(createTransactionDto, invoiceFile, req) {
        const userId = req.user.id;
        return await this.financeService.createTransaction(createTransactionDto, userId, invoiceFile);
    }
    async updateTransaction(id, updateTransactionDto, req) {
        const userId = req.user.id;
        return await this.financeService.updateTransaction(id, updateTransactionDto, userId);
    }
    async patchTransaction(id, updateTransactionDto, req) {
        const userId = req.user.id;
        return await this.financeService.updateTransaction(id, updateTransactionDto, userId);
    }
    async deleteTransaction(id) {
        return await this.financeService.deleteTransaction(id);
    }
    async updateProjectBudget(id, updateBudgetDto) {
        return await this.financeService.updateProjectBudget(id, updateBudgetDto);
    }
    async generateFinanceReport(generateReportDto, req) {
        try {
            const userId = req.user.id;
            const result = await this.reportGeneratorService.generateReport(generateReportDto, userId);
            return {
                success: true,
                filePath: result.filePath,
                fileName: result.fileName,
                fileSize: result.fileSize,
                downloadUrl: `/admin/finance/reports/download/${result.fileName}`,
            };
        }
        catch (error) {
            throw new common_1.HttpException(error.message || "Failed to generate report", common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async downloadReport(fileName, res) {
        const filePath = path.resolve(process.cwd(), "uploads", "reports", fileName);
        if (!fs.existsSync(filePath)) {
            throw new common_1.HttpException("File not found", common_1.HttpStatus.NOT_FOUND);
        }
        const mimeType = fileName.endsWith(".pdf")
            ? "application/pdf"
            : fileName.endsWith(".xlsx")
                ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                : fileName.endsWith(".docx")
                    ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    : "application/octet-stream";
        res.setHeader("Content-Type", mimeType);
        res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
        return res.sendFile(filePath);
    }
    async getSpendingTrends(period = "monthly", projectId, dateFrom, dateTo) {
        return await this.analyticsService.getSpendingTrends(period, projectId, dateFrom, dateTo);
    }
    async getCategoryBreakdown() {
        return await this.analyticsService.getCategoryBreakdown();
    }
    async configureBudgetAlerts(alertConfig) {
        throw new common_1.HttpException("Budget alerts configuration will be implemented", common_1.HttpStatus.NOT_IMPLEMENTED);
    }
    async recalculateAllProjects() {
        return await this.financeService.recalculateAllProjectsSpentAmounts();
    }
};
exports.FinanceController = FinanceController;
__decorate([
    (0, common_1.Get)("projects"),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [project_finance_query_dto_1.ProjectFinanceQueryDto]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "getProjectsFinance", null);
__decorate([
    (0, common_1.Get)("projects/:id"),
    (0, common_1.SetMetadata)(roles_decorator_1.ROLES_KEY, []),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Query)("page")),
    __param(2, (0, common_1.Query)("limit")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "getProjectFinance", null);
__decorate([
    (0, common_1.Get)("metrics"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "getFinanceMetrics", null);
__decorate([
    (0, common_1.Get)("transactions"),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [transaction_dto_1.TransactionQueryDto]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "getTransactions", null);
__decorate([
    (0, common_1.Post)("transactions"),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)("invoice", {
        limits: { fileSize: 10 * 1024 * 1024 },
    })),
    (0, common_1.SetMetadata)(roles_decorator_1.ROLES_KEY, [
        user_entity_1.UserRole.CONSULTANT,
        user_entity_1.UserRole.FINANCE,
        user_entity_1.UserRole.CONTRACTOR,
        user_entity_1.UserRole.SUB_CONTRACTOR
    ]),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [transaction_dto_1.CreateTransactionDto, Object, Object]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "createTransaction", null);
__decorate([
    (0, common_1.Put)("transactions/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, transaction_dto_1.UpdateTransactionDto, Object]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "updateTransaction", null);
__decorate([
    (0, common_1.Patch)("transactions/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, transaction_dto_1.UpdateTransactionDto, Object]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "patchTransaction", null);
__decorate([
    (0, common_1.Delete)("transactions/:id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "deleteTransaction", null);
__decorate([
    (0, common_1.Put)("projects/:id/budget"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, budget_update_dto_1.UpdateProjectBudgetDto]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "updateProjectBudget", null);
__decorate([
    (0, common_1.Post)("reports/generate"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [generate_report_dto_1.GenerateReportDto, Object]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "generateFinanceReport", null);
__decorate([
    (0, common_2.Get)("reports/download/:fileName"),
    __param(0, (0, common_1.Param)("fileName")),
    __param(1, (0, common_2.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "downloadReport", null);
__decorate([
    (0, common_1.Get)("analytics/spending-trends"),
    __param(0, (0, common_1.Query)("period")),
    __param(1, (0, common_1.Query)("projectId")),
    __param(2, (0, common_1.Query)("dateFrom")),
    __param(3, (0, common_1.Query)("dateTo")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "getSpendingTrends", null);
__decorate([
    (0, common_1.Get)("analytics/category-breakdown"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "getCategoryBreakdown", null);
__decorate([
    (0, common_1.Post)("budget-alerts"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [budget_update_dto_1.BudgetAlertConfigDto]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "configureBudgetAlerts", null);
__decorate([
    (0, common_1.Post)("recalculate-all"),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.CONSULTANT, user_entity_1.UserRole.FINANCE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "recalculateAllProjects", null);
exports.FinanceController = FinanceController = __decorate([
    (0, common_1.Controller)("consultant/finance"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.CONSULTANT, user_entity_1.UserRole.FINANCE),
    __metadata("design:paramtypes", [finance_service_1.FinanceService,
        analytics_service_1.AnalyticsService,
        finance_report_generator_service_1.FinanceReportGeneratorService])
], FinanceController);
//# sourceMappingURL=finance.controller.js.map