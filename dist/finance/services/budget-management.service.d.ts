import { Repository, DataSource } from "typeorm";
import { Project } from "../../entities/project.entity";
import { ProjectFinancialSummary } from "../../entities/project-financial-summary.entity";
import { BudgetCategory } from "../entities/budget-category.entity";
import { ProjectTransaction } from "../entities/project-transaction.entity";
import { BudgetAlert } from "../entities/budget-alert.entity";
import { UpdateProjectBudgetDto } from "../dto/budget-update.dto";
export declare class BudgetManagementService {
    private readonly projectRepository;
    private readonly financialSummaryRepository;
    private readonly budgetCategoryRepository;
    private readonly transactionRepository;
    private readonly alertRepository;
    private readonly dataSource;
    constructor(projectRepository: Repository<Project>, financialSummaryRepository: Repository<ProjectFinancialSummary>, budgetCategoryRepository: Repository<BudgetCategory>, transactionRepository: Repository<ProjectTransaction>, alertRepository: Repository<BudgetAlert>, dataSource: DataSource);
    updateProjectBudget(projectId: string, updateBudgetDto: UpdateProjectBudgetDto): Promise<{
        success: boolean;
    }>;
    updateCategorySpentAmount(categoryId: string): Promise<void>;
    updateProjectSpentAmount(projectId: string): Promise<number>;
    updateProjectAllocatedBudget(projectId: string): Promise<void>;
    updateProjectFinancialStatus(projectId: string): Promise<void>;
    checkAndCreateBudgetAlerts(projectId: string): Promise<void>;
    private createBudgetAlert;
    recalculateAllCategoriesSpentAmounts(): Promise<{
        fixed: number;
        errors: string[];
    }>;
    recalculateAllProjectsSpentAmounts(): Promise<{
        fixed: number;
        errors: string[];
    }>;
}
