import { Repository } from "typeorm";
import { Project } from "../../entities/project.entity";
import { BudgetCategory } from "../entities/budget-category.entity";
import { ProjectTransaction } from "../entities/project-transaction.entity";
import { ProjectSavings } from "../entities/project-savings.entity";
import { BudgetAlert } from "../entities/budget-alert.entity";
import { ProjectFinanceQueryDto } from "../dto/project-finance-query.dto";
import { ProjectFinanceListResponseDto, ProjectFinanceDto, FinanceMetricsDto } from "../dto/project-finance-response.dto";
import { CreateTransactionDto, UpdateTransactionDto, TransactionQueryDto } from "../dto/transaction.dto";
import { UpdateProjectBudgetDto } from "../dto/budget-update.dto";
export declare class FinanceService {
    private readonly projectRepository;
    private readonly budgetCategoryRepository;
    private readonly transactionRepository;
    private readonly savingsRepository;
    private readonly alertRepository;
    private readonly logger;
    constructor(projectRepository: Repository<Project>, budgetCategoryRepository: Repository<BudgetCategory>, transactionRepository: Repository<ProjectTransaction>, savingsRepository: Repository<ProjectSavings>, alertRepository: Repository<BudgetAlert>);
    getProjectsFinance(query: ProjectFinanceQueryDto): Promise<ProjectFinanceListResponseDto>;
    getProjectFinanceById(projectId: string): Promise<ProjectFinanceDto>;
    getFinanceMetrics(): Promise<FinanceMetricsDto>;
    getTransactions(query: TransactionQueryDto): Promise<{
        transactions: ProjectTransaction[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    createTransaction(createTransactionDto: CreateTransactionDto, userId: string): Promise<ProjectTransaction>;
    updateTransaction(transactionId: string, updateTransactionDto: UpdateTransactionDto, userId: string): Promise<ProjectTransaction>;
    deleteTransaction(transactionId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    updateProjectBudget(projectId: string, updateBudgetDto: UpdateProjectBudgetDto): Promise<{
        success: boolean;
    }>;
    private transformToProjectFinanceDto;
    private formatDateToISOString;
    private calculateFinanceMetrics;
    private calculateMonthlySpending;
    private generateTransactionNumber;
    private updateCategorySpentAmount;
    private updateProjectSpentAmount;
    private updateProjectAllocatedBudget;
    private updateProjectFinancialStatus;
    private checkAndCreateBudgetAlerts;
    private createBudgetAlert;
    getAdminFinancialMetrics(): Promise<{
        totalProjects: number;
        totalBudget: number;
        totalSpent: number;
        totalSaved: number;
        avgSavingsPercentage: number;
        projectsOverBudget: number;
        projectsUnderBudget: number;
    }>;
    getRevenueBreakdown(): Promise<{
        category: any;
        amount: number;
    }[]>;
    getExpenseBreakdown(): Promise<{
        category: any;
        amount: number;
    }[]>;
}
