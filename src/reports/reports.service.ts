import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Report, ReportStatus } from "../entities/report.entity";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private readonly reportsRepository: Repository<Report>
  ) {}

  // 1. List reports
  async adminList({ type, status, page = 1, limit = 20 }) {
    const qb = this.reportsRepository.createQueryBuilder("report");
    if (type) qb.andWhere("report.type = :type", { type });
    if (status) qb.andWhere("report.status = :status", { status });
    qb.orderBy("report.createdAt", "DESC")
      .skip((page - 1) * limit)
      .take(limit);
    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }

  // 2. Generate a new report (simulate async processing)
  async adminGenerate(body: any) {
    const { name, type, description, parameters } = body;
    const report = this.reportsRepository.create({
      name,
      type,
      description,
      parameters: JSON.stringify(parameters || {}),
      status: ReportStatus.PROCESSING,
    });
    const saved = await this.reportsRepository.save(report);
    // Simulate async report generation (replace with real logic)
    setTimeout(async () => {
      try {
        // Simulate file creation
        const fileName = `${saved.id}.txt`;
        const filePath = path.join(
          __dirname,
          "../../uploads/reports",
          fileName
        );
        fs.writeFileSync(
          filePath,
          `Report: ${name}\nType: ${type}\nGenerated at: ${new Date().toISOString()}`
        );
        saved.filePath = filePath;
        saved.fileName = fileName;
        saved.fileMimeType = "text/plain";
        saved.status = ReportStatus.READY;
        await this.reportsRepository.save(saved);
      } catch (err) {
        saved.status = ReportStatus.FAILED;
        await this.reportsRepository.save(saved);
      }
    }, 2000); // Simulate 2s processing
    return saved;
  }

  // 3. Get report details
  async adminGetDetails(id: string) {
    const report = await this.reportsRepository.findOne({ where: { id } });
    if (!report) throw new Error("Report not found");
    return report;
  }

  // 4. Download report file
  async adminDownload(id: string) {
    const report = await this.reportsRepository.findOne({ where: { id } });
    if (!report || !report.filePath) throw new Error("Report file not found");
    return {
      path: report.filePath,
      filename: report.fileName,
      mimetype: report.fileMimeType || "application/octet-stream",
    };
  }

  // 5. Delete report
  async adminDelete(id: string) {
    const report = await this.reportsRepository.findOne({ where: { id } });
    if (!report) throw new Error("Report not found");
    if (report.filePath && fs.existsSync(report.filePath)) {
      fs.unlinkSync(report.filePath);
    }
    await this.reportsRepository.delete(id);
    return { success: true };
  }
}
