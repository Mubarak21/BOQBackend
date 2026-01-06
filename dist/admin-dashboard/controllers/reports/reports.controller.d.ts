import { ReportsService } from "../../../reports/reports.service";
import { CreateReportDto } from "../../dto/reports/create-report.dto";
import { ReportQueryDto } from "../../dto/reports/report-query.dto";
import { ReportResponseDto, ReportListResponseDto } from "../../dto/reports/report-response.dto";
import { Response } from "express";
export declare class AdminReportsController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    listReports(query: ReportQueryDto): Promise<ReportListResponseDto>;
    generateReport(createReportDto: CreateReportDto, req: any): Promise<ReportResponseDto>;
    getReport(id: string): Promise<ReportResponseDto>;
    downloadReport(id: string, res: Response): Promise<void>;
    deleteReport(id: string): Promise<{
        success: boolean;
    }>;
    cleanupOldReports(): Promise<{
        message: string;
    }>;
}
