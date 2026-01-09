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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminFinanceController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../../auth/guards/jwt-auth.guard");
const finance_service_1 = require("../../../finance/services/finance.service");
let AdminFinanceController = class AdminFinanceController {
    constructor(financeService) {
        this.financeService = financeService;
    }
    async getFinancialMetrics() {
        return this.financeService.getAdminFinancialMetrics();
    }
    async getRevenueBreakdown() {
        return this.financeService.getRevenueBreakdown();
    }
    async getExpenseBreakdown() {
        return this.financeService.getExpenseBreakdown();
    }
};
exports.AdminFinanceController = AdminFinanceController;
__decorate([
    (0, common_1.Get)("metrics"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminFinanceController.prototype, "getFinancialMetrics", null);
__decorate([
    (0, common_1.Get)("revenue/breakdown"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminFinanceController.prototype, "getRevenueBreakdown", null);
__decorate([
    (0, common_1.Get)("expenses/breakdown"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminFinanceController.prototype, "getExpenseBreakdown", null);
exports.AdminFinanceController = AdminFinanceController = __decorate([
    (0, common_1.Controller)("consultant/finance"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [finance_service_1.FinanceService])
], AdminFinanceController);
//# sourceMappingURL=finance.controller.js.map