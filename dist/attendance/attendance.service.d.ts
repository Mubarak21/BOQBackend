import { Repository } from "typeorm";
import { DailyAttendance } from "../entities/daily-attendance.entity";
import { Project } from "../entities/project.entity";
import { User } from "../entities/user.entity";
import { RecordAttendanceDto } from "./dto/record-attendance.dto";
export declare class AttendanceService {
    private attendanceRepository;
    private projectsRepository;
    constructor(attendanceRepository: Repository<DailyAttendance>, projectsRepository: Repository<Project>);
    private hasProjectAccess;
    private isConsultant;
    private isContractorOrSubContractor;
    recordAttendance(projectId: string, dto: RecordAttendanceDto, user: User): Promise<DailyAttendance>;
    getByProject(projectId: string, user: User): Promise<DailyAttendance[]>;
    getDailySummary(date: string, user: User): Promise<{
        projectId: string;
        projectTitle: string;
        workersPresent: number;
        recordedAt: string;
    }[]>;
    getProjectAttendanceSummary(projectId: string, fromDate: string, toDate: string, user: User): Promise<{
        date: string;
        workersPresent: number;
    }[]>;
}
