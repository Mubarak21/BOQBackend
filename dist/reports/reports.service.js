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
var ReportsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const report_entity_1 = require("../entities/report.entity");
const report_generator_service_1 = require("./report-generator.service");
const fs = require("fs");
let ReportsService = ReportsService_1 = class ReportsService {
    constructor(reportsRepository, reportGeneratorService) {
        this.reportsRepository = reportsRepository;
        this.reportGeneratorService = reportGeneratorService;
        this.logger = new common_1.Logger(ReportsService_1.name);
    }
    async adminList(query) {
        const { page, limit, search, type, status, dateFrom, dateTo, generatedBy, sortBy, sortOrder, } = query;
        const queryBuilder = this.reportsRepository
            .createQueryBuilder("report")
            .leftJoinAndSelect("report.generatedBy", "user");
        if (search) {
            queryBuilder.andWhere("(report.name ILIKE :search OR report.description ILIKE :search)", { search: `%${search}%` });
        }
        if (type) {
            queryBuilder.andWhere("report.type = :type", { type });
        }
        if (status) {
            queryBuilder.andWhere("report.status = :status", { status });
        }
        if (dateFrom) {
            queryBuilder.andWhere("report.createdAt >= :dateFrom", {
                dateFrom: new Date(dateFrom),
            });
        }
        if (dateTo) {
            queryBuilder.andWhere("report.createdAt <= :dateTo", {
                dateTo: new Date(dateTo),
            });
        }
        if (generatedBy) {
            queryBuilder.andWhere("report.generated_by = :generatedBy", {
                generatedBy,
            });
        }
        const sortField = sortBy === "generatedBy" ? "user.display_name" : `report.${sortBy}`;
        queryBuilder.orderBy(sortField, sortOrder.toUpperCase());
        const skip = (page - 1) * limit;
        queryBuilder.skip(skip).take(limit);
        const [reports, total] = await queryBuilder.getManyAndCount();
        return {
            items: reports.map((report) => this.mapToResponseDto(report)),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async adminGenerate(createReportDto, user) {
        this.logger.log(`Generating new report: ${createReportDto.name} by user: ${user.id}`);
        const report = this.reportsRepository.create({
            name: createReportDto.name,
            description: createReportDto.description,
            type: createReportDto.type,
            parameters: createReportDto.parameters,
            status: report_entity_1.ReportStatus.SCHEDULED,
            generatedBy: user,
            generated_by: user.id,
            dateFrom: createReportDto.dateFrom
                ? new Date(createReportDto.dateFrom)
                : null,
            dateTo: createReportDto.dateTo ? new Date(createReportDto.dateTo) : null,
            progress: 0,
            retentionDate: this.calculateRetentionDate(),
        });
        const savedReport = await this.reportsRepository.save(report);
        this.processReportGeneration(savedReport);
        return this.mapToResponseDto(savedReport);
    }
    async processReportGeneration(report) {
        try {
            report.status = report_entity_1.ReportStatus.PROCESSING;
            report.progress = 10;
            await this.reportsRepository.save(report);
            this.logger.log(`Processing report: ${report.id}`);
            const result = await this.reportGeneratorService.generateReport(report);
            report.filePath = result.filePath;
            report.fileName = result.fileName;
            report.fileSize = result.fileSize;
            report.fileMimeType = this.getMimeType(report.type);
            report.status = report_entity_1.ReportStatus.READY;
            report.progress = 100;
            await this.reportsRepository.save(report);
            this.logger.log(`Report generated successfully: ${report.id}`);
        }
        catch (error) {
            this.logger.error(`Report generation failed: ${report.id}`, error);
            report.status = report_entity_1.ReportStatus.FAILED;
            report.error = error.message;
            await this.reportsRepository.save(report);
        }
    }
    async adminGetDetails(id) {
        const report = await this.reportsRepository.findOne({
            where: { id },
            relations: ["generatedBy"],
        });
        if (!report) {
            throw new common_1.NotFoundException("Report not found");
        }
        return this.mapToResponseDto(report);
    }
    async adminDownload(id) {
        const report = await this.reportsRepository.findOne({ where: { id } });
        if (!report) {
            throw new common_1.NotFoundException("Report not found");
        }
        if (report.status !== report_entity_1.ReportStatus.READY) {
            throw new common_1.BadRequestException(`Report is not ready for download. Status: ${report.status}`);
        }
        if (!report.filePath || !fs.existsSync(report.filePath)) {
            throw new common_1.NotFoundException("Report file not found");
        }
        return {
            path: report.filePath,
            filename: report.fileName,
            mimetype: report.fileMimeType || "application/octet-stream",
        };
    }
    async adminDelete(id) {
        const report = await this.reportsRepository.findOne({ where: { id } });
        if (!report) {
            throw new common_1.NotFoundException("Report not found");
        }
        if (report.filePath && fs.existsSync(report.filePath)) {
            try {
                fs.unlinkSync(report.filePath);
                this.logger.log(`Deleted report file: ${report.filePath}`);
            }
            catch (error) {
                this.logger.error(`Failed to delete report file: ${report.filePath}`, error);
            }
        }
        await this.reportsRepository.delete(id);
        return { success: true };
    }
    async cleanupOldReports() {
        const expiredReports = await this.reportsRepository.find({
            where: {
                retentionDate: (0, typeorm_2.Between)(new Date("1970-01-01"), new Date()),
            },
        });
        for (const report of expiredReports) {
            await this.adminDelete(report.id);
        }
        this.logger.log(`Cleaned up ${expiredReports.length} expired reports`);
    }
    mapToResponseDto(report) {
        return {
            id: report.id,
            name: report.name,
            description: report.description,
            type: report.type,
            status: report.status,
            progress: report.progress,
            parameters: report.parameters,
            fileName: report.fileName,
            fileMimeType: report.fileMimeType,
            fileSize: report.fileSize,
            dateFrom: report.dateFrom,
            dateTo: report.dateTo,
            generatedBy: report.generatedBy
                ? {
                    id: report.generatedBy.id,
                    display_name: report.generatedBy.display_name,
                    email: report.generatedBy.email,
                }
                : null,
            error: report.error,
            createdAt: report.createdAt,
            updatedAt: report.updatedAt,
            retentionDate: report.retentionDate,
        };
    }
    getMimeType(type) {
        switch (type) {
            case report_entity_1.ReportType.PDF:
                return "application/pdf";
            case report_entity_1.ReportType.XLSX:
                return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            case report_entity_1.ReportType.CSV:
                return "text/csv";
            case report_entity_1.ReportType.JSON:
                return "application/json";
            default:
                return "application/octet-stream";
        }
    }
    calculateRetentionDate() {
        const retentionDays = parseInt(process.env.REPORT_RETENTION_DAYS || "30");
        const retentionDate = new Date();
        retentionDate.setDate(retentionDate.getDate() + retentionDays);
        return retentionDate;
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = ReportsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(report_entity_1.Report)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        report_generator_service_1.ReportGeneratorService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map