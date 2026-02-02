import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between, In } from "typeorm";
import { DailyAttendance } from "../entities/daily-attendance.entity";
import { Project } from "../entities/project.entity";
import { User, UserRole } from "../entities/user.entity";
import { RecordAttendanceDto } from "./dto/record-attendance.dto";

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(DailyAttendance)
    private attendanceRepository: Repository<DailyAttendance>,
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
  ) {}

  private hasProjectAccess(project: Project, userId: string): boolean {
    return (
      project.owner_id === userId ||
      (project.collaborators || []).some((c) => c.id === userId) ||
      false
    );
  }

  private isConsultant(user: User): boolean {
    return user.role?.toLowerCase() === UserRole.CONSULTANT.toLowerCase();
  }

  /** Contractors and sub-contractors can both record and view attendance for projects they have access to. */
  private isContractorOrSubContractor(user: User): boolean {
    const r = user.role?.toLowerCase();
    return r === UserRole.CONTRACTOR.toLowerCase() || r === UserRole.SUB_CONTRACTOR.toLowerCase();
  }

  async recordAttendance(
    projectId: string,
    dto: RecordAttendanceDto,
    user: User,
  ): Promise<DailyAttendance> {
    if (!this.isContractorOrSubContractor(user)) {
      throw new ForbiddenException("Only contractors and sub-contractors can record daily attendance");
    }

    const project = await this.projectsRepository.findOne({
      where: { id: projectId },
      relations: ["collaborators"],
    });
    if (!project) {
      throw new NotFoundException("Project not found");
    }
    if (!this.hasProjectAccess(project, user.id)) {
      throw new ForbiddenException("You do not have access to this project");
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

  async getByProject(projectId: string, user: User): Promise<DailyAttendance[]> {
    const project = await this.projectsRepository.findOne({
      where: { id: projectId },
      relations: ["collaborators"],
    });
    if (!project) {
      throw new NotFoundException("Project not found");
    }
    if (!this.isConsultant(user) && !this.hasProjectAccess(project, user.id)) {
      throw new ForbiddenException("You do not have access to this project");
    }

    const records = await this.attendanceRepository.find({
      where: { project_id: projectId },
      relations: ["recordedByUser"],
      order: { attendance_date: "DESC" },
    });
    return records;
  }

  async getDailySummary(date: string, user: User): Promise<{ projectId: string; projectTitle: string; workersPresent: number; recordedAt: string }[]> {
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
        where: { project_id: In(projectIds), attendance_date: dateStr },
        relations: ["project"],
      });
      return records.map((r) => ({
        projectId: r.project_id,
        projectTitle: r.project?.title ?? "",
        workersPresent: r.workers_present,
        recordedAt: r.updated_at?.toISOString() ?? r.created_at?.toISOString() ?? "",
      }));
    }

    throw new ForbiddenException("Only consultants, contractors, and sub-contractors can view attendance summary");
  }

  async getProjectAttendanceSummary(
    projectId: string,
    fromDate: string,
    toDate: string,
    user: User,
  ): Promise<{ date: string; workersPresent: number }[]> {
    const project = await this.projectsRepository.findOne({
      where: { id: projectId },
      relations: ["collaborators"],
    });
    if (!project) {
      throw new NotFoundException("Project not found");
    }
    if (!this.isConsultant(user) && !this.hasProjectAccess(project, user.id)) {
      throw new ForbiddenException("You do not have access to this project");
    }

    const fromStr = fromDate.split("T")[0];
    const toStr = toDate.split("T")[0];
    const records = await this.attendanceRepository.find({
      where: {
        project_id: projectId,
        attendance_date: Between(fromStr, toStr),
      },
      order: { attendance_date: "ASC" },
    });
    return records.map((r) => ({
      date: r.attendance_date,
      workersPresent: r.workers_present,
    }));
  }
}
