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
exports.DailyAttendance = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const project_entity_1 = require("./project.entity");
let DailyAttendance = class DailyAttendance {
};
exports.DailyAttendance = DailyAttendance;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], DailyAttendance.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "project_id" }),
    __metadata("design:type", String)
], DailyAttendance.prototype, "project_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => project_entity_1.Project, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "project_id" }),
    __metadata("design:type", project_entity_1.Project)
], DailyAttendance.prototype, "project", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "recorded_by" }),
    __metadata("design:type", String)
], DailyAttendance.prototype, "recorded_by", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: "recorded_by" }),
    __metadata("design:type", user_entity_1.User)
], DailyAttendance.prototype, "recordedByUser", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date", name: "attendance_date" }),
    __metadata("design:type", String)
], DailyAttendance.prototype, "attendance_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", name: "workers_present", default: 0 }),
    __metadata("design:type", Number)
], DailyAttendance.prototype, "workers_present", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], DailyAttendance.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at" }),
    __metadata("design:type", Date)
], DailyAttendance.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: "updated_at" }),
    __metadata("design:type", Date)
], DailyAttendance.prototype, "updated_at", void 0);
exports.DailyAttendance = DailyAttendance = __decorate([
    (0, typeorm_1.Entity)("daily_attendance"),
    (0, typeorm_1.Unique)(["project_id", "attendance_date"])
], DailyAttendance);
//# sourceMappingURL=daily-attendance.entity.js.map