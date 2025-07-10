"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const report_entity_1 = require("../entities/report.entity");
const fs = require("fs");
const path = require("path");
let ReportsService = class ReportsService {
    constructor(reportsRepository) {
        this.reportsRepository = reportsRepository;
    }
    async adminList({ type, status, page = 1, limit = 20 }) {
        const qb = this.reportsRepository.createQueryBuilder("report");
        if (type)
            qb.andWhere("report.type = :type", { type });
        if (status)
            qb.andWhere("report.status = :status", { status });
        qb.orderBy("report.createdAt", "DESC")
            .skip((page - 1) * limit)
            .take(limit);
        const [items, total] = await qb.getManyAndCount();
        return { items, total, page, limit };
    }
    async adminGenerate(body) {
        const { name, type, description, parameters } = body;
        const report = this.reportsRepository.create({
            name,
            type,
            description,
            parameters: JSON.stringify(parameters || {}),
            status: report_entity_1.ReportStatus.PROCESSING,
        });
        const saved = await this.reportsRepository.save(report);
        setTimeout(async () => {
            try {
                const fileName = `${saved.id}.txt`;
                const filePath = path.join(__dirname, "../../uploads/reports", fileName);
                fs.writeFileSync(filePath, `Report: ${name}\nType: ${type}\nGenerated at: ${new Date().toISOString()}`);
                saved.filePath = filePath;
                saved.fileName = fileName;
                saved.fileMimeType = "text/plain";
                saved.status = report_entity_1.ReportStatus.READY;
                await this.reportsRepository.save(saved);
            }
            catch (err) {
                saved.status = report_entity_1.ReportStatus.FAILED;
                await this.reportsRepository.save(saved);
            }
        }, 2000);
        return saved;
    }
    async adminGetDetails(id) {
        const report = await this.reportsRepository.findOne({ where: { id } });
        if (!report)
            throw new Error("Report not found");
        return report;
    }
    async adminDownload(id) {
        const report = await this.reportsRepository.findOne({ where: { id } });
        if (!report || !report.filePath)
            throw new Error("Report file not found");
        return {
            path: report.filePath,
            filename: report.fileName,
            mimetype: report.fileMimeType || "application/octet-stream",
        };
    }
    async adminDelete(id) {
        const report = await this.reportsRepository.findOne({ where: { id } });
        if (!report)
            throw new Error("Report not found");
        if (report.filePath && fs.existsSync(report.filePath)) {
            fs.unlinkSync(report.filePath);
        }
        await this.reportsRepository.delete(id);
        return { success: true };
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(report_entity_1.Report)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ReportsService);
//# sourceMappingURL=reports.service.js.map