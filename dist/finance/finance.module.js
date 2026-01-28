"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinanceModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const auth_module_1 = require("../auth/auth.module");
const dashboard_module_1 = require("../dashboard/dashboard.module");
const inventory_module_1 = require("../inventory/inventory.module");
const project_entity_1 = require("../entities/project.entity");
const budget_category_entity_1 = require("./entities/budget-category.entity");
const project_transaction_entity_1 = require("./entities/project-transaction.entity");
const project_savings_entity_1 = require("./entities/project-savings.entity");
const budget_alert_entity_1 = require("./entities/budget-alert.entity");
const financial_report_entity_1 = require("./entities/financial-report.entity");
const project_financial_summary_entity_1 = require("../entities/project-financial-summary.entity");
const finance_service_1 = require("./services/finance.service");
const analytics_service_1 = require("./services/analytics.service");
const finance_report_generator_service_1 = require("./services/finance-report-generator.service");
const transaction_service_1 = require("./services/transaction.service");
const budget_management_service_1 = require("./services/budget-management.service");
const finance_controller_1 = require("./controllers/finance.controller");
const finance_dashboard_controller_1 = require("./controllers/finance-dashboard.controller");
let FinanceModule = class FinanceModule {
};
exports.FinanceModule = FinanceModule;
exports.FinanceModule = FinanceModule = __decorate([
    (0, common_1.Module)({
        imports: [
            auth_module_1.AuthModule,
            dashboard_module_1.DashboardModule,
            inventory_module_1.InventoryModule,
            typeorm_1.TypeOrmModule.forFeature([
                project_entity_1.Project,
                project_financial_summary_entity_1.ProjectFinancialSummary,
                budget_category_entity_1.BudgetCategory,
                project_transaction_entity_1.ProjectTransaction,
                project_savings_entity_1.ProjectSavings,
                budget_alert_entity_1.BudgetAlert,
                financial_report_entity_1.FinancialReport,
            ]),
        ],
        controllers: [finance_controller_1.FinanceController, finance_dashboard_controller_1.FinanceDashboardController],
        providers: [
            finance_service_1.FinanceService,
            analytics_service_1.AnalyticsService,
            finance_report_generator_service_1.FinanceReportGeneratorService,
            transaction_service_1.TransactionService,
            budget_management_service_1.BudgetManagementService,
        ],
        exports: [
            finance_service_1.FinanceService,
            analytics_service_1.AnalyticsService,
            finance_report_generator_service_1.FinanceReportGeneratorService,
            transaction_service_1.TransactionService,
            budget_management_service_1.BudgetManagementService,
        ],
    })
], FinanceModule);
//# sourceMappingURL=finance.module.js.map