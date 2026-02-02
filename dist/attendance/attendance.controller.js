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
exports.AttendanceController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const attendance_service_1 = require("./attendance.service");
const record_attendance_dto_1 = require("./dto/record-attendance.dto");
let AttendanceController = class AttendanceController {
    constructor(attendanceService) {
        this.attendanceService = attendanceService;
    }
    recordAttendance(projectId, dto, req) {
        return this.attendanceService.recordAttendance(projectId, dto, req.user);
    }
    getByProject(projectId, req) {
        return this.attendanceService.getByProject(projectId, req.user);
    }
    getDailySummary(date, req) {
        const dateParam = date || new Date().toISOString().split("T")[0];
        return this.attendanceService.getDailySummary(dateParam, req.user);
    }
    getProjectSummary(projectId, from, to, req) {
        const fromDate = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        const toDate = to || new Date().toISOString().split("T")[0];
        return this.attendanceService.getProjectAttendanceSummary(projectId, fromDate, toDate, req.user);
    }
};
exports.AttendanceController = AttendanceController;
__decorate([
    (0, common_1.Post)("project/:projectId"),
    __param(0, (0, common_1.Param)("projectId")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, record_attendance_dto_1.RecordAttendanceDto, Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "recordAttendance", null);
__decorate([
    (0, common_1.Get)("project/:projectId"),
    __param(0, (0, common_1.Param)("projectId")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "getByProject", null);
__decorate([
    (0, common_1.Get)("daily"),
    __param(0, (0, common_1.Query)("date")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "getDailySummary", null);
__decorate([
    (0, common_1.Get)("project/:projectId/summary"),
    __param(0, (0, common_1.Param)("projectId")),
    __param(1, (0, common_1.Query)("from")),
    __param(2, (0, common_1.Query)("to")),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "getProjectSummary", null);
exports.AttendanceController = AttendanceController = __decorate([
    (0, common_1.Controller)("attendance"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [attendance_service_1.AttendanceService])
], AttendanceController);
//# sourceMappingURL=attendance.controller.js.map