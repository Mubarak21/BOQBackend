import { Repository, DataSource } from "typeorm";
import { Project } from "../../entities/project.entity";
import { BudgetCategory } from "../entities/budget-category.entity";
import { ProjectTransaction } from "../entities/project-transaction.entity";
import { BudgetAlert } from "../entities/budget-alert.entity";
import { CreateTransactionDto, UpdateTransactionDto, TransactionQueryDto } from "../dto/transaction.dto";
import { BudgetManagementService } from "./budget-management.service";
export declare class TransactionService {
    private readonly projectRepository;
    private readonly budgetCategoryRepository;
    private readonly transactionRepository;
    private readonly alertRepository;
    private readonly budgetManagementService;
    private readonly dataSource;
    constructor(projectRepository: Repository<Project>, budgetCategoryRepository: Repository<BudgetCategory>, transactionRepository: Repository<ProjectTransaction>, alertRepository: Repository<BudgetAlert>, budgetManagementService: BudgetManagementService, dataSource: DataSource);
    getTransactions(query: TransactionQueryDto): Promise<{
        transactions: ProjectTransaction[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    createTransaction(createTransactionDto: CreateTransactionDto, userId: string, invoiceFile?: Express.Multer.File): Promise<ProjectTransaction>;
    private updateCategorySpentAmountInTransaction;
    private updateProjectSpentAmountInTransaction;
    private checkAndCreateBudgetAlertsInTransaction;
    updateTransaction(transactionId: string, updateTransactionDto: UpdateTransactionDto, userId: string): Promise<ProjectTransaction>;
    deleteTransaction(transactionId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    private generateTransactionNumber;
}
