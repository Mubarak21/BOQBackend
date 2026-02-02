import { AttendanceService } from "./attendance.service";
import { RecordAttendanceDto } from "./dto/record-attendance.dto";
import { RequestWithUser } from "../auth/interfaces/request-with-user.interface";
export declare class AttendanceController {
    private readonly attendanceService;
    constructor(attendanceService: AttendanceService);
    recordAttendance(projectId: string, dto: RecordAttendanceDto, req: RequestWithUser): Promise<import("../entities/daily-attendance.entity").DailyAttendance>;
    getByProject(projectId: string, req: RequestWithUser): Promise<import("../entities/daily-attendance.entity").DailyAttendance[]>;
    getDailySummary(date: string, req: RequestWithUser): Promise<{
        projectId: string;
        projectTitle: string;
        workersPresent: number;
        recordedAt: string;
    }[]>;
    getProjectSummary(projectId: string, from: string, to: string, req: RequestWithUser): Promise<{
        date: string;
        workersPresent: number;
    }[]>;
}
