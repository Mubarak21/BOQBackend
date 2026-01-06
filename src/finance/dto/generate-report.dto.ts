import { IsEnum, IsOptional, IsBoolean, IsArray } from "class-validator";
import { FileFormat } from "../entities/financial-report.entity";

export class GenerateReportDto {
  @IsEnum(FileFormat, {
    message: "Format must be one of: pdf, excel, word",
  })
  format: FileFormat;

  @IsOptional()
  @IsBoolean()
  includeProjects?: boolean = true;

  @IsOptional()
  @IsBoolean()
  includeProgress?: boolean = true;

  @IsOptional()
  @IsBoolean()
  includeInventory?: boolean = true;

  @IsOptional()
  @IsBoolean()
  includePayments?: boolean = true;

  @IsOptional()
  @IsArray()
  projectIds?: string[];

  @IsOptional()
  dateFrom?: string;

  @IsOptional()
  dateTo?: string;
}
