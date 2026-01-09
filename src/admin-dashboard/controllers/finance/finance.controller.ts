import { Controller, Get, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { FinanceService } from "../../../finance/services/finance.service";

@Controller("consultant/finance")
@UseGuards(JwtAuthGuard)
export class AdminFinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get("metrics")
  async getFinancialMetrics() {
    return this.financeService.getAdminFinancialMetrics();
  }

  @Get("revenue/breakdown")
  async getRevenueBreakdown() {
    return this.financeService.getRevenueBreakdown();
  }

  @Get("expenses/breakdown")
  async getExpenseBreakdown() {
    return this.financeService.getExpenseBreakdown();
  }
}
