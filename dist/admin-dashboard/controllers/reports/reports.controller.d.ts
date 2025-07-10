import { ReportsService } from "../../../reports/reports.service";
import { Response } from "express";
export declare class AdminReportsController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    listReports(type?: string, status?: string, page?: number, limit?: number): Promise<{
        items: import("../../../entities/report.entity").Report[];
        total: number;
        page: number;
        limit: number;
    }>;
    generateReport(body: any): Promise<import("../../../entities/report.entity").Report>;
    getReport(id: string): Promise<import("../../../entities/report.entity").Report>;
    downloadReport(id: string, res: Response): Promise<void>;
    deleteReport(id: string): Promise<{
        success: boolean;
    }>;
}
