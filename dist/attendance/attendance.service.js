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
exports.AttendanceService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const daily_attendance_entity_1 = require("../entities/daily-attendance.entity");
const project_entity_1 = require("../entities/project.entity");
const user_entity_1 = require("../entities/user.entity");
let AttendanceService = class AttendanceService {
    constructor(attendanceRepository, projectsRepository) {
        this.attendanceRepository = attendanceRepository;
        this.projectsRepository = projectsRepository;
    }
    hasProjectAccess(project, userId) {
        return (project.owner_id === userId ||
            (project.collaborators || []).some((c) => c.id === userId) ||
            false);
    }
    isConsultant(user) {
        return user.role?.toLowerCase() === user_entity_1.UserRole.CONSULTANT.toLowerCase();
    }
    isContractorOrSubContractor(user) {
        const r = user.role?.toLowerCase();
        return r === user_entity_1.UserRole.CONTRACTOR.toLowerCase() || r === user_entity_1.UserRole.SUB_CONTRACTOR.toLowerCase();
    }
    async recordAttendance(projectId, dto, user) {
        if (!this.isContractorOrSubContractor(user)) {
            throw new common_1.ForbiddenException("Only contractors and sub-contractors can record daily attendance");
        }
        const project = await this.projectsRepository.findOne({
            where: { id: projectId },
            relations: ["collaborators"],
        });
        if (!project) {
            throw new common_1.NotFoundException("Project not found");
        }
        if (!this.hasProjectAccess(project, user.id)) {
            throw new common_1.ForbiddenException("You do not have access to this project");
        }
        const dateStr = dto.attendance_date.split("T")[0];
        const existing = await this.attendanceRepository.findOne({
            where: { project_id: projectId, attendance_date: dateStr },
        });
        if (existing) {
            existing.workers_present = dto.workers_present;
            existing.notes = dto.notes ?? existing.notes;
            existing.recorded_by = user.id;
            return this.attendanceRepository.save(existing);
        }
        const entity = this.attendanceRepository.create({
            project_id: projectId,
            recorded_by: user.id,
            attendance_date: dateStr,
            workers_present: dto.workers_present,
            notes: dto.notes ?? null,
        });
        return this.attendanceRepository.save(entity);
    }
    async getByProject(projectId, user) {
        const project = await this.projectsRepository.findOne({
            where: { id: projectId },
            relations: ["collaborators"],
        });
        if (!project) {
            throw new common_1.NotFoundException("Project not found");
        }
        if (!this.isConsultant(user) && !this.hasProjectAccess(project, user.id)) {
            throw new common_1.ForbiddenException("You do not have access to this project");
        }
        const records = await this.attendanceRepository.find({
            where: { project_id: projectId },
            relations: ["recordedByUser"],
            order: { attendance_date: "DESC" },
        });
        return records;
    }
    async getDailySummary(date, user) {
        const dateStr = date.split("T")[0];
        if (this.isConsultant(user)) {
            const records = await this.attendanceRepository.find({
                where: { attendance_date: dateStr },
                relations: ["project", "recordedByUser"],
            });
            return records.map((r) => ({
                projectId: r.project_id,
                projectTitle: r.project?.title ?? "",
                workersPresent: r.workers_present,
                recordedAt: r.updated_at?.toISOString() ?? r.created_at?.toISOString() ?? "",
            }));
        }
        if (this.isContractorOrSubContractor(user)) {
            const userProjectIds = await this.projectsRepository
                .createQueryBuilder("p")
                .leftJoin("p.collaborators", "c")
                .where("p.owner_id = :userId", { userId: user.id })
                .orWhere("c.id = :userId", { userId: user.id })
                .select("p.id")
                .getMany();
            const ids = userProjectIds.map((p) => p.id);
            if (ids.length === 0) {
                return [];
            }
            const projectIds = userProjectIds.map((p) => p.id);
            const records = await this.attendanceRepository.find({
                where: { project_id: (0, typeorm_2.In)(projectIds), attendance_date: dateStr },
                relations: ["project"],
            });
            return records.map((r) => ({
                projectId: r.project_id,
                projectTitle: r.project?.title ?? "",
                workersPresent: r.workers_present,
                recordedAt: r.updated_at?.toISOString() ?? r.created_at?.toISOString() ?? "",
            }));
        }
        throw new common_1.ForbiddenException("Only consultants, contractors, and sub-contractors can view attendance summary");
    }
    async getProjectAttendanceSummary(projectId, fromDate, toDate, user) {
        const project = await this.projectsRepository.findOne({
            where: { id: projectId },
            relations: ["collaborators"],
        });
        if (!project) {
            throw new common_1.NotFoundException("Project not found");
        }
        if (!this.isConsultant(user) && !this.hasProjectAccess(project, user.id)) {
            throw new common_1.ForbiddenException("You do not have access to this project");
        }
        const fromStr = fromDate.split("T")[0];
        const toStr = toDate.split("T")[0];
        const records = await this.attendanceRepository.find({
            where: {
                project_id: projectId,
                attendance_date: (0, typeorm_2.Between)(fromStr, toStr),
            },
            order: { attendance_date: "ASC" },
        });
        return records.map((r) => ({
            date: r.attendance_date,
            workersPresent: r.workers_present,
        }));
    }
};
exports.AttendanceService = AttendanceService;
exports.AttendanceService = AttendanceService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(daily_attendance_entity_1.DailyAttendance)),
    __param(1, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], AttendanceService);
//# sourceMappingURL=attendance.service.js.map