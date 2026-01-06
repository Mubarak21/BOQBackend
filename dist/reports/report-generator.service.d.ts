import { Report } from "../entities/report.entity";
import { ProjectsService } from "../projects/projects.service";
import { UsersService } from "../users/users.service";
import { ActivitiesService } from "../activities/activities.service";
import { DashboardService } from "../dashboard/dashboard.service";
export declare class ReportGeneratorService {
    private readonly projectsService;
    private readonly usersService;
    private readonly activitiesService;
    private readonly dashboardService;
    private readonly logger;
    constructor(projectsService: ProjectsService, usersService: UsersService, activitiesService: ActivitiesService, dashboardService: DashboardService);
    generateReport(report: Report): Promise<{
        filePath: string;
        fileName: string;
        fileSize: number;
    }>;
    private gatherReportData;
    private getProjectsData;
    private getUsersData;
    private getActivitiesData;
    private getAnalyticsData;
    private generatePDF;
    private generateExcel;
    private generateCSV;
    private generateJSON;
}
