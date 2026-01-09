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
exports.AdminReportsController = void 0;
const common_1 = require("@nestjs/common");
const reports_service_1 = require("../../../reports/reports.service");
const jwt_auth_guard_1 = require("../../../auth/guards/jwt-auth.guard");
const create_report_dto_1 = require("../../dto/reports/create-report.dto");
const report_query_dto_1 = require("../../dto/reports/report-query.dto");
let AdminReportsController = class AdminReportsController {
    constructor(reportsService) {
        this.reportsService = reportsService;
    }
    async listReports(query) {
        return this.reportsService.adminList(query);
    }
    async generateReport(createReportDto, req) {
        const user = req.user;
        if (!user) {
            throw new common_1.BadRequestException("User not found in request");
        }
        return this.reportsService.adminGenerate(createReportDto, user);
    }
    async getReport(id) {
        return this.reportsService.adminGetDetails(id);
    }
    async downloadReport(id, res) {
        try {
            const file = await this.reportsService.adminDownload(id);
            res.setHeader("Content-Type", file.mimetype);
            res.setHeader("Content-Disposition", `attachment; filename="${file.filename}"`);
            res.sendFile(file.path);
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw new common_1.HttpException(error.message, common_1.HttpStatus.NOT_FOUND);
            }
            else if (error instanceof common_1.BadRequestException) {
                throw new common_1.HttpException(error.message, common_1.HttpStatus.BAD_REQUEST);
            }
            else {
                throw new common_1.HttpException("Failed to download report", common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
    }
    async deleteReport(id) {
        return this.reportsService.adminDelete(id);
    }
    async cleanupOldReports() {
        await this.reportsService.cleanupOldReports();
        return { message: "Old reports cleanup completed" };
    }
};
exports.AdminReportsController = AdminReportsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [report_query_dto_1.ReportQueryDto]),
    __metadata("design:returntype", Promise)
], AdminReportsController.prototype, "listReports", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_report_dto_1.CreateReportDto, Object]),
    __metadata("design:returntype", Promise)
], AdminReportsController.prototype, "generateReport", null);
__decorate([
    (0, common_1.Get)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminReportsController.prototype, "getReport", null);
__decorate([
    (0, common_1.Get)(":id/download"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminReportsController.prototype, "downloadReport", null);
__decorate([
    (0, common_1.Delete)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminReportsController.prototype, "deleteReport", null);
__decorate([
    (0, common_1.Post)("cleanup"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminReportsController.prototype, "cleanupOldReports", null);
exports.AdminReportsController = AdminReportsController = __decorate([
    (0, common_1.Controller)("consultant/reports"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [reports_service_1.ReportsService])
], AdminReportsController);
//# sourceMappingURL=reports.controller.js.map