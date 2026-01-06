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
exports.GenerateReportDto = void 0;
const class_validator_1 = require("class-validator");
const financial_report_entity_1 = require("../entities/financial-report.entity");
class GenerateReportDto {
    constructor() {
        this.includeProjects = true;
        this.includeProgress = true;
        this.includeInventory = true;
        this.includePayments = true;
    }
}
exports.GenerateReportDto = GenerateReportDto;
__decorate([
    (0, class_validator_1.IsEnum)(financial_report_entity_1.FileFormat, {
        message: "Format must be one of: pdf, excel, word",
    }),
    __metadata("design:type", String)
], GenerateReportDto.prototype, "format", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], GenerateReportDto.prototype, "includeProjects", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], GenerateReportDto.prototype, "includeProgress", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], GenerateReportDto.prototype, "includeInventory", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], GenerateReportDto.prototype, "includePayments", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], GenerateReportDto.prototype, "projectIds", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], GenerateReportDto.prototype, "dateFrom", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], GenerateReportDto.prototype, "dateTo", void 0);
//# sourceMappingURL=generate-report.dto.js.map