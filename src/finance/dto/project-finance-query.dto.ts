import {
  IsOptional,
  IsNumber,
  IsString,
  IsEnum,
  Min,
  Max,
} from "class-validator";
import { Transform, Type } from "class-transformer";
import { ProjectStatus } from "../../entities/project.entity";

export class ProjectFinanceQueryDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  dateFrom?: Date;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  dateTo?: Date;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  budgetMin?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  budgetMax?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  savingsMin?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  savingsMax?: number;
}
