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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinancialReport = exports.GenerationStatus = exports.FileFormat = exports.ReportType = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../entities/user.entity");
var ReportType;
(function (ReportType) {
    ReportType["SUMMARY"] = "summary";
    ReportType["DETAILED"] = "detailed";
    ReportType["TRANSACTIONS"] = "transactions";
    ReportType["SAVINGS"] = "savings";
})(ReportType || (exports.ReportType = ReportType = {}));
var FileFormat;
(function (FileFormat) {
    FileFormat["PDF"] = "pdf";
    FileFormat["EXCEL"] = "excel";
    FileFormat["CSV"] = "csv";
    FileFormat["WORD"] = "word";
})(FileFormat || (exports.FileFormat = FileFormat = {}));
var GenerationStatus;
(function (GenerationStatus) {
    GenerationStatus["PENDING"] = "pending";
    GenerationStatus["PROCESSING"] = "processing";
    GenerationStatus["COMPLETED"] = "completed";
    GenerationStatus["FAILED"] = "failed";
})(GenerationStatus || (exports.GenerationStatus = GenerationStatus = {}));
let FinancialReport = class FinancialReport {
    get isExpired() {
        return this.expiresAt && this.expiresAt < new Date();
    }
    get isReady() {
        return (this.generationStatus === GenerationStatus.COMPLETED && !this.isExpired);
    }
    get fileSizeFormatted() {
        if (!this.fileSize)
            return "Unknown";
        const bytes = this.fileSize;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
    }
};
exports.FinancialReport = FinancialReport;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], FinancialReport.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, name: "report_name" }),
    __metadata("design:type", String)
], FinancialReport.prototype, "reportName", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: ReportType,
        name: "report_type",
    }),
    __metadata("design:type", String)
], FinancialReport.prototype, "reportType", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: FileFormat,
        name: "file_format",
    }),
    __metadata("design:type", String)
], FinancialReport.prototype, "fileFormat", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500, nullable: true, name: "file_path" }),
    __metadata("design:type", String)
], FinancialReport.prototype, "filePath", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "bigint", nullable: true, name: "file_size" }),
    __metadata("design:type", Number)
], FinancialReport.prototype, "fileSize", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date", nullable: true, name: "date_range_from" }),
    __metadata("design:type", Date)
], FinancialReport.prototype, "dateRangeFrom", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date", nullable: true, name: "date_range_to" }),
    __metadata("design:type", Date)
], FinancialReport.prototype, "dateRangeTo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid", array: true, nullable: true, name: "project_ids" }),
    __metadata("design:type", Array)
], FinancialReport.prototype, "projectIds", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "jsonb", nullable: true }),
    __metadata("design:type", Object)
], FinancialReport.prototype, "parameters", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: GenerationStatus,
        default: GenerationStatus.PENDING,
        name: "generation_status",
    }),
    __metadata("design:type", String)
], FinancialReport.prototype, "generationStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamp", nullable: true, name: "generated_at" }),
    __metadata("design:type", Date)
], FinancialReport.prototype, "generatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "generated_by" }),
    __metadata("design:type", String)
], FinancialReport.prototype, "generatedBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: "generated_by" }),
    __metadata("design:type", user_entity_1.User)
], FinancialReport.prototype, "generator", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", default: 0, name: "download_count" }),
    __metadata("design:type", Number)
], FinancialReport.prototype, "downloadCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamp", nullable: true, name: "expires_at" }),
    __metadata("design:type", Date)
], FinancialReport.prototype, "expiresAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at" }),
    __metadata("design:type", Date)
], FinancialReport.prototype, "createdAt", void 0);
exports.FinancialReport = FinancialReport = __decorate([
    (0, typeorm_1.Entity)("financial_reports")
], FinancialReport);
//# sourceMappingURL=financial-report.entity.js.map