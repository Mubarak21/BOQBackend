import { Repository } from "typeorm";
import { Report } from "../entities/report.entity";
import { User } from "../entities/user.entity";
import { ReportGeneratorService } from "./report-generator.service";
import { CreateReportDto } from "../admin-dashboard/dto/reports/create-report.dto";
import { ReportQueryDto } from "../admin-dashboard/dto/reports/report-query.dto";
import { ReportResponseDto, ReportListResponseDto } from "../admin-dashboard/dto/reports/report-response.dto";
export declare class ReportsService {
    private readonly reportsRepository;
    private readonly reportGeneratorService;
    private readonly logger;
    constructor(reportsRepository: Repository<Report>, reportGeneratorService: ReportGeneratorService);
    adminList(query: ReportQueryDto): Promise<ReportListResponseDto>;
    adminGenerate(createReportDto: CreateReportDto, user: User): Promise<ReportResponseDto>;
    private processReportGeneration;
    adminGetDetails(id: string): Promise<ReportResponseDto>;
    adminDownload(id: string): Promise<{
        path: string;
        filename: string;
        mimetype: string;
    }>;
    adminDelete(id: string): Promise<{
        success: boolean;
    }>;
    cleanupOldReports(): Promise<void>;
    private mapToResponseDto;
    private getMimeType;
    private calculateRetentionDate;
}
