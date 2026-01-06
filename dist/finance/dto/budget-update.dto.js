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
exports.BudgetAlertConfigDto = exports.UpdateProjectBudgetDto = exports.BudgetCategoryUpdateDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class BudgetCategoryUpdateDto {
}
exports.BudgetCategoryUpdateDto = BudgetCategoryUpdateDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BudgetCategoryUpdateDto.prototype, "categoryId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], BudgetCategoryUpdateDto.prototype, "budgetedAmount", void 0);
class UpdateProjectBudgetDto {
}
exports.UpdateProjectBudgetDto = UpdateProjectBudgetDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], UpdateProjectBudgetDto.prototype, "totalBudget", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => BudgetCategoryUpdateDto),
    __metadata("design:type", Array)
], UpdateProjectBudgetDto.prototype, "categories", void 0);
class BudgetAlertConfigDto {
}
exports.BudgetAlertConfigDto = BudgetAlertConfigDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BudgetAlertConfigDto.prototype, "projectId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], BudgetAlertConfigDto.prototype, "warningThreshold", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], BudgetAlertConfigDto.prototype, "criticalThreshold", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Boolean),
    __metadata("design:type", Boolean)
], BudgetAlertConfigDto.prototype, "emailNotifications", void 0);
//# sourceMappingURL=budget-update.dto.js.map