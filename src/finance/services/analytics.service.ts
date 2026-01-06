import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ProjectTransaction } from "../entities/project-transaction.entity";
import { BudgetCategory } from "../entities/budget-category.entity";

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(ProjectTransaction)
    private readonly transactionRepository: Repository<ProjectTransaction>,
    @InjectRepository(BudgetCategory)
    private readonly budgetCategoryRepository: Repository<BudgetCategory>
  ) {}

  async getSpendingTrends(
    period: string,
    projectId?: string,
    dateFrom?: string,
    dateTo?: string
  ) {
    const queryBuilder =
      this.transactionRepository.createQueryBuilder("transaction");

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

    // Group by period
    let dateFormat: string;
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
        budgeted: 0, // Would need to calculate from budget data
        variance: 0, // Would need to calculate variance
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

    const totalAmount = categories.reduce(
      (sum, cat) => sum + parseFloat(cat.amount),
      0
    );

    return {
      categories: categories.map((cat) => ({
        category: cat.category,
        amount: parseFloat(cat.amount),
        percentage:
          totalAmount > 0 ? (parseFloat(cat.amount) / totalAmount) * 100 : 0,
        budgeted: parseFloat(cat.budgeted),
        variance: parseFloat(cat.amount) - parseFloat(cat.budgeted),
      })),
    };
  }
}
