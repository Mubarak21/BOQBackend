import { IsDateString, IsInt, IsOptional, Min, Max } from "class-validator";

export class RecordAttendanceDto {
  @IsDateString()
  attendance_date: string;

  @IsInt()
  @Min(0)
  @Max(10000)
  workers_present: number;

  @IsOptional()
  notes?: string;
}
