import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { ReportsService } from "./reports.service";

@Injectable()
export class ReportsSchedulerService {
  private readonly logger = new Logger(ReportsSchedulerService.name);

  constructor(private readonly reportsService: ReportsService) {}

  // Run cleanup daily at 2 AM
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleReportsCleanup() {
    this.logger.log("Starting scheduled reports cleanup...");

    try {
      await this.reportsService.cleanupOldReports();
      this.logger.log("Scheduled reports cleanup completed successfully");
    } catch (error) {
      this.logger.error("Scheduled reports cleanup failed", error);
    }
  }
}
