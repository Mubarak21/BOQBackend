import { FinanceService } from "../services/finance.service";
import { AnalyticsService } from "../services/analytics.service";
import { ProjectFinanceQueryDto } from "../dto/project-finance-query.dto";
import { CreateTransactionDto, UpdateTransactionDto, TransactionQueryDto } from "../dto/transaction.dto";
import { UpdateProjectBudgetDto, BudgetAlertConfigDto } from "../dto/budget-update.dto";
import { GenerateReportDto } from "../dto/generate-report.dto";
import { FinanceReportGeneratorService } from "../services/finance-report-generator.service";
import { Response } from "express";
export declare class FinanceController {
    private readonly financeService;
    private readonly analyticsService;
    private readonly reportGeneratorService;
    constructor(financeService: FinanceService, analyticsService: AnalyticsService, reportGeneratorService: FinanceReportGeneratorService);
    getProjectsFinance(query: ProjectFinanceQueryDto): Promise<import("../dto/project-finance-response.dto").ProjectFinanceListResponseDto>;
    getProjectFinance(id: string, page?: number, limit?: number): Promise<import("../dto/project-finance-response.dto").ProjectFinanceDto>;
    getFinanceMetrics(): Promise<import("../dto/project-finance-response.dto").FinanceMetricsDto>;
    getTransactions(query: TransactionQueryDto): Promise<{
        transactions: import("../entities/project-transaction.entity").ProjectTransaction[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    createTransaction(createTransactionDto: CreateTransactionDto, invoiceFile: Express.Multer.File, req: any): Promise<import("../entities/project-transaction.entity").ProjectTransaction>;
    updateTransaction(id: string, updateTransactionDto: UpdateTransactionDto, req: any): Promise<import("../entities/project-transaction.entity").ProjectTransaction>;
    patchTransaction(id: string, updateTransactionDto: UpdateTransactionDto, req: any): Promise<import("../entities/project-transaction.entity").ProjectTransaction>;
    deleteTransaction(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    updateProjectBudget(id: string, updateBudgetDto: UpdateProjectBudgetDto): Promise<{
        success: boolean;
    }>;
    generateFinanceReport(generateReportDto: GenerateReportDto, req: any): Promise<{
        success: boolean;
        filePath: string;
        fileName: string;
        fileSize: number;
        downloadUrl: string;
    }>;
    downloadReport(fileName: string, res: Response): Promise<void>;
    getSpendingTrends(period?: string, projectId?: string, dateFrom?: string, dateTo?: string): Promise<{
        trends: {
            period: any;
            amount: number;
            budgeted: number;
            variance: number;
        }[];
    }>;
    getCategoryBreakdown(): Promise<{
        categories: {
            category: any;
            amount: number;
            percentage: number;
            budgeted: number;
            variance: number;
        }[];
    }>;
    configureBudgetAlerts(alertConfig: BudgetAlertConfigDto): Promise<void>;
    recalculateAllProjects(): Promise<{
        fixed: number;
        errors: string[];
    }>;
}
