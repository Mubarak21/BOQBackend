import { ReportsService } from "./reports.service";
export declare class ReportsSchedulerService {
    private readonly reportsService;
    private readonly logger;
    constructor(reportsService: ReportsService);
    handleReportsCleanup(): Promise<void>;
}
