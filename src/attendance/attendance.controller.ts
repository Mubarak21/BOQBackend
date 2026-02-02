import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AttendanceService } from "./attendance.service";
import { RecordAttendanceDto } from "./dto/record-attendance.dto";
import { RequestWithUser } from "../auth/interfaces/request-with-user.interface";

@Controller("attendance")
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post("project/:projectId")
  recordAttendance(
    @Param("projectId") projectId: string,
    @Body() dto: RecordAttendanceDto,
    @Request() req: RequestWithUser,
  ) {
    return this.attendanceService.recordAttendance(projectId, dto, req.user);
  }

  @Get("project/:projectId")
  getByProject(
    @Param("projectId") projectId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.attendanceService.getByProject(projectId, req.user);
  }

  @Get("daily")
  getDailySummary(
    @Query("date") date: string,
    @Request() req: RequestWithUser,
  ) {
    const dateParam = date || new Date().toISOString().split("T")[0];
    return this.attendanceService.getDailySummary(dateParam, req.user);
  }

  @Get("project/:projectId/summary")
  getProjectSummary(
    @Param("projectId") projectId: string,
    @Query("from") from: string,
    @Query("to") to: string,
    @Request() req: RequestWithUser,
  ) {
    const fromDate = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const toDate = to || new Date().toISOString().split("T")[0];
    return this.attendanceService.getProjectAttendanceSummary(
      projectId,
      fromDate,
      toDate,
      req.user,
    );
  }
}
