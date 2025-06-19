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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateTaskDto = void 0;
const class_validator_1 = require("class-validator");
const task_entity_1 = require("../../entities/task.entity");
class CreateTaskDto {
}
exports.CreateTaskDto = CreateTaskDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTaskDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateTaskDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(task_entity_1.TaskStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", typeof (_a = typeof task_entity_1.TaskStatus !== "undefined" && task_entity_1.TaskStatus) === "function" ? _a : Object)
], CreateTaskDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(task_entity_1.TaskPriority),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", typeof (_b = typeof task_entity_1.TaskPriority !== "undefined" && task_entity_1.TaskPriority) === "function" ? _b : Object)
], CreateTaskDto.prototype, "priority", void 0);
__decorate([
    (0, class_validator_1.IsDate)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Date)
], CreateTaskDto.prototype, "due_date", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateTaskDto.prototype, "estimated_hours", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateTaskDto.prototype, "project_id", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateTaskDto.prototype, "assignee_id", void 0);
//# sourceMappingURL=create-task.dto.js.map