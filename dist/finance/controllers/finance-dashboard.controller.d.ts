import { FinanceService } from "../services/finance.service";
import { InventoryService } from "../../inventory/inventory.service";
import { DashboardService } from "../../dashboard/dashboard.service";
import { InventoryQueryDto } from "../../inventory/dto/inventory-query.dto";
import { TransactionQueryDto } from "../dto/transaction.dto";
import { RequestWithUser } from "../../auth/interfaces/request-with-user.interface";
export declare class FinanceDashboardController {
    private readonly financeService;
    private readonly inventoryService;
    private readonly dashboardService;
    constructor(financeService: FinanceService, inventoryService: InventoryService, dashboardService: DashboardService);
    getOverview(req: RequestWithUser): Promise<{
        section: string;
        role: string;
        timestamp: string;
        performance: {
            duration: string;
        };
        data: {
            dashboard: any;
            inventory: any;
            finance: any;
        };
    }>;
    getInventory(query: InventoryQueryDto, req: RequestWithUser): Promise<{
        section: string;
        role: string;
        timestamp: string;
        performance: {
            duration: string;
        };
        data: {
            items: import("../../entities/inventory.entity").Inventory[];
            total: number;
            page: number;
            limit: number;
            totalPages: number;
            stats: {
                totalItems: number;
                activeItems: number;
                lowStockItems: number;
                totalValue: number;
                categoryCounts: {
                    [key: string]: number;
                };
            };
            lowStockItems: import("../../entities/inventory.entity").Inventory[];
        };
    }>;
    getFinancial(transactionQuery: TransactionQueryDto, req: RequestWithUser): Promise<{
        section: string;
        role: string;
        timestamp: string;
        performance: {
            duration: string;
        };
        data: {
            transactions: {
                transactions: import("../entities/project-transaction.entity").ProjectTransaction[];
                total: number;
                page: number;
                limit: number;
                totalPages: number;
            } | {
                transactions: any[];
                total: number;
                page: number;
                limit: number;
                totalPages: number;
            };
            metrics: import("../dto/project-finance-response.dto").FinanceMetricsDto | {
                totalProjects: number;
                totalBudget: number;
                totalSpent: number;
                totalSaved: number;
                avgSavingsPercentage: number;
                projectsOverBudget: number;
                projectsUnderBudget: number;
            };
            projects: import("../dto/project-finance-response.dto").ProjectFinanceListResponseDto | {
                projects: any[];
                metrics: any;
                total: number;
                page: number;
                limit: number;
                totalPages: number;
            };
            projectDetails: any;
        };
    }>;
    getReports(req: RequestWithUser): Promise<{
        section: string;
        role: string;
        timestamp: string;
        performance: {
            duration: string;
        };
        data: {
            financeMetrics: import("../dto/project-finance-response.dto").FinanceMetricsDto | {
                totalProjects: number;
                totalBudget: number;
                totalSpent: number;
                totalSaved: number;
                avgSavingsPercentage: number;
                projectsOverBudget: number;
                projectsUnderBudget: number;
            };
            projects: import("../dto/project-finance-response.dto").ProjectFinanceListResponseDto | {
                projects: any[];
                metrics: any;
                total: number;
                page: number;
                limit: number;
                totalPages: number;
            };
            inventory: any;
            availableReports: {
                type: string;
                name: string;
                description: string;
            }[];
        };
    }>;
}
