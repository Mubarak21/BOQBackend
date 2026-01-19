import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Project } from "../../entities/project.entity";
import { BudgetCategory } from "../entities/budget-category.entity";
import { ProjectTransaction } from "../entities/project-transaction.entity";
import { BudgetAlert, AlertType } from "../entities/budget-alert.entity";
import { UpdateProjectBudgetDto } from "../dto/budget-update.dto";
import { toNumber, validateAndNormalizeAmount, extractTransactionAmount, sumAmounts } from "../../utils/amount.utils";

@Injectable()
export class BudgetManagementService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(BudgetCategory)
    private readonly budgetCategoryRepository: Repository<BudgetCategory>,
    @InjectRepository(ProjectTransaction)
    private readonly transactionRepository: Repository<ProjectTransaction>,
    @InjectRepository(BudgetAlert)
    private readonly alertRepository: Repository<BudgetAlert>
  ) {}

  /**
   * Update project budget and category budgets
   */
  async updateProjectBudget(
    projectId: string,
    updateBudgetDto: UpdateProjectBudgetDto
  ) {
    const { totalBudget, categories } = updateBudgetDto;

    // Verify project exists
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException("Project not found");
    }

    // Update project total budget
    project.totalBudget = totalBudget;
    project.budgetLastUpdated = new Date();
    await this.projectRepository.save(project);

    // Update category budgets
    for (const categoryUpdate of categories) {
      const category = await this.budgetCategoryRepository.findOne({
        where: { id: categoryUpdate.categoryId },
      });

      if (category) {
        category.budgetedAmount = categoryUpdate.budgetedAmount;
        await this.budgetCategoryRepository.save(category);
      }
    }

    // Recalculate allocated budget
    await this.updateProjectAllocatedBudget(projectId);

    // Update financial status
    await this.updateProjectFinancialStatus(projectId);

    return { success: true };
  }

  /**
   * Update category spent amount based on transactions
   * Sums all transaction amounts regardless of type
   * IMPORTANT: Categories are project-specific, so transactions are automatically scoped to the correct project
   */
  async updateCategorySpentAmount(categoryId: string) {

    
    // Get category to verify it exists and get its projectId for validation
    const category = await this.budgetCategoryRepository.findOne({
      where: { id: categoryId },
      select: ['id', 'projectId'],
    });

    if (!category) {

      return;
    }

    // Filter transactions by categoryId (categories are project-specific, so this is safe)
    const transactions = await this.transactionRepository.find({
      where: { categoryId },
    });

    // Sum all transaction amounts (add all transactions regardless of type)
    // Defensive check: Ensure all transactions belong to the category's project
    const validTransactions = transactions.filter(t => {
      if (t.projectId !== category.projectId) {

        return false; // Skip this transaction to prevent cross-project contamination
      }
      return true;
    });

    const totalSpent = sumAmounts(validTransactions);

    // Validate and normalize the result (decimal(15,2) for category spent amount)
    const normalizedSpent = validateAndNormalizeAmount(totalSpent, 9999999999999.99, 2);

    await this.budgetCategoryRepository.update(categoryId, {
      spentAmount: normalizedSpent,
    });


  }


  /**
   * Update project spent amount - calculate directly from transactions for accuracy
   * Sums all transaction amounts regardless of type, then remaining = totalBudget - totalSpent
   * IMPORTANT: Only processes transactions for the specified projectId to avoid mixing projects
   */
  async updateProjectSpentAmount(projectId: string) {

    
    // Calculate spent amount directly from transactions (more accurate than summing categories)
    // CRITICAL: Filter by projectId to ensure we only get transactions for this specific project
    const transactions = await this.transactionRepository.find({
      where: { projectId },
    });



    // Sum all transaction amounts (add all transactions regardless of type)
    // Defensive check: Ensure all transactions belong to the specified project
    const validTransactions = transactions.filter(t => {
      if (t.projectId !== projectId) {

        return false; // Skip this transaction to prevent cross-project contamination
      }
      return true;
    });

    const totalSpent = sumAmounts(validTransactions);

    // Validate and normalize the result (decimal(15,2) for project spent amount)
    const normalizedSpent = validateAndNormalizeAmount(totalSpent, 9999999999999.99, 2);

    await this.projectRepository.update(projectId, {
      spentAmount: normalizedSpent,
    });


    
    // Return the updated value for immediate use
    return normalizedSpent;
  }

  /**
   * Update project allocated budget based on active categories
   */
  async updateProjectAllocatedBudget(projectId: string) {
    const categories = await this.budgetCategoryRepository.find({
      where: { projectId, isActive: true },
    });

    const totalAllocated = categories.reduce(
      (sum, c) => sum + c.budgetedAmount,
      0
    );

    await this.projectRepository.update(projectId, {
      allocatedBudget: totalAllocated,
    });
  }

  /**
   * Update project financial status
   */
  async updateProjectFinancialStatus(projectId: string) {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });
    if (!project) return;

    let financialStatus: "on_track" | "warning" | "over_budget" | "excellent";

    if (project.spentAmount > project.totalBudget) {
      financialStatus = "over_budget";
    } else if (project.spentAmount > project.totalBudget * 0.9) {
      financialStatus = "warning";
    } else if (project.estimatedSavings > project.totalBudget * 0.1) {
      financialStatus = "excellent";
    } else {
      financialStatus = "on_track";
    }

    await this.projectRepository.update(projectId, {
      financialStatus,
    });
  }

  /**
   * Check and create budget alerts if thresholds are exceeded
   */
  async checkAndCreateBudgetAlerts(projectId: string) {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });
    if (!project) return;

    // Ensure values are numbers before calculation
    const totalBudget = typeof project.totalBudget === 'number' 
      ? project.totalBudget 
      : parseFloat(String(project.totalBudget || 0)) || 0;
    const spentAmount = typeof project.spentAmount === 'number' 
      ? project.spentAmount 
      : parseFloat(String(project.spentAmount || 0)) || 0;

    // Calculate utilization percentage and ensure it's valid
    let utilizationPercentage = 0;
    if (totalBudget > 0) {
      utilizationPercentage = (spentAmount / totalBudget) * 100;
    }

    // Validate and clamp percentage to fit in decimal(5,2) - max 999.99
    utilizationPercentage = Math.min(Math.max(utilizationPercentage, 0), 999.99);
    utilizationPercentage = Math.round(utilizationPercentage * 100) / 100; // Round to 2 decimals

    // Check for different alert thresholds
    if (utilizationPercentage >= 95) {
      await this.createBudgetAlert(
        projectId,
        AlertType.CRITICAL,
        95,
        utilizationPercentage
      );
    } else if (utilizationPercentage >= 85) {
      await this.createBudgetAlert(
        projectId,
        AlertType.WARNING,
        85,
        utilizationPercentage
      );
    }

    if (spentAmount > totalBudget) {
      await this.createBudgetAlert(
        projectId,
        AlertType.OVER_BUDGET,
        100,
        utilizationPercentage
      );
    }
  }

  /**
   * Create a budget alert
   */
  private async createBudgetAlert(
    projectId: string,
    alertType: AlertType,
    thresholdPercentage: number,
    currentPercentage: number
  ) {
    // Validate and normalize percentages to fit in decimal(5,2) - max 999.99
    const normalizedThreshold = Math.min(Math.max(
      typeof thresholdPercentage === 'number' ? thresholdPercentage : parseFloat(String(thresholdPercentage || 0)) || 0,
      0
    ), 999.99);
    const normalizedCurrent = Math.min(Math.max(
      typeof currentPercentage === 'number' ? currentPercentage : parseFloat(String(currentPercentage || 0)) || 0,
      0
    ), 999.99);

    // Round to 2 decimal places
    const threshold = Math.round(normalizedThreshold * 100) / 100;
    const current = Math.round(normalizedCurrent * 100) / 100;

    // Check if alert already exists for this project and type
    const existingAlert = await this.alertRepository.findOne({
      where: {
        projectId,
        alertType,
        isActive: true,
      },
    });

    if (existingAlert) {
      // Update existing alert
      existingAlert.thresholdPercentage = threshold;
      existingAlert.currentPercentage = current;
      existingAlert.triggeredAt = new Date();
      await this.alertRepository.save(existingAlert);
    } else {
      // Create new alert
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

  /**
   * Recalculate all categories' spent amounts from transactions first
   */
  async recalculateAllCategoriesSpentAmounts(): Promise<{ fixed: number; errors: string[] }> {
    const errors: string[] = [];
    let fixed = 0;

    try {
      const categories = await this.budgetCategoryRepository.find({
        select: ['id'],
      });

      for (const category of categories) {
        try {
          await this.updateCategorySpentAmount(category.id);
          fixed++;
        } catch (error) {
          errors.push(`Category ${category.id}: ${error.message}`);
        }
      }
    } catch (error) {
      errors.push(`Failed to recalculate categories: ${error.message}`);
    }

    return { fixed, errors };
  }

  /**
   * Recalculate all projects' spent amounts from transactions
   * This fixes any incorrect calculations
   * First recalculates all categories, then all projects
   */
  async recalculateAllProjectsSpentAmounts(): Promise<{ fixed: number; errors: string[] }> {
    const errors: string[] = [];
    let fixed = 0;

    try {
      // First, recalculate all categories
      const categoryResult = await this.recalculateAllCategoriesSpentAmounts();


      // Then, recalculate all projects
      const projects = await this.projectRepository.find({
        select: ['id'],
      });

      for (const project of projects) {
        try {
          await this.updateProjectSpentAmount(project.id);
          fixed++;
        } catch (error) {
          errors.push(`Project ${project.id}: ${error.message}`);
        }
      }

      errors.push(...categoryResult.errors);
    } catch (error) {
      errors.push(`Failed to recalculate: ${error.message}`);
    }

    return { fixed, errors };
  }
}

