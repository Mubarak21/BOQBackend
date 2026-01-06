import {
  IsEnum,
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
} from "class-validator";
import { Transform } from "class-transformer";
import { ReportType, ReportStatus } from "../../../entities/report.entity";

export class ReportQueryDto {
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 10;

  @IsString()
  @IsOptional()
  search?: string;

  @IsEnum(ReportType)
  @IsOptional()
  type?: ReportType;

  @IsEnum(ReportStatus)
  @IsOptional()
  status?: ReportStatus;

  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @IsDateString()
  @IsOptional()
  dateTo?: string;

  @IsString()
  @IsOptional()
  generatedBy?: string;

  // Sort options
  @IsString()
  @IsOptional()
  sortBy?: string = "createdAt";

  @IsString()
  @IsOptional()
  sortOrder?: "asc" | "desc" = "desc";
}
