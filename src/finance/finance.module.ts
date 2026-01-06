import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "../auth/auth.module";
import { DashboardModule } from "../dashboard/dashboard.module";
import { InventoryModule } from "../inventory/inventory.module";
import { Project } from "../entities/project.entity";
import { BudgetCategory } from "./entities/budget-category.entity";
import { ProjectTransaction } from "./entities/project-transaction.entity";
import { ProjectSavings } from "./entities/project-savings.entity";
import { BudgetAlert } from "./entities/budget-alert.entity";
import { FinancialReport } from "./entities/financial-report.entity";
import { FinanceService } from "./services/finance.service";
import { AnalyticsService } from "./services/analytics.service";
import { FinanceReportGeneratorService } from "./services/finance-report-generator.service";
import { FinanceController } from "./controllers/finance.controller";
import { FinanceDashboardController } from "./controllers/finance-dashboard.controller";

@Module({
  imports: [
    AuthModule,
    DashboardModule,
    InventoryModule,
    TypeOrmModule.forFeature([
      Project,
      BudgetCategory,
      ProjectTransaction,
      ProjectSavings,
      BudgetAlert,
      FinancialReport,
    ]),
  ],
  controllers: [FinanceController, FinanceDashboardController],
  providers: [FinanceService, AnalyticsService, FinanceReportGeneratorService],
  exports: [FinanceService, AnalyticsService, FinanceReportGeneratorService],
})
export class FinanceModule {}
