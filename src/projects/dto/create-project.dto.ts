import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsISO8601,
  IsNumber,
  Min,
} from "class-validator";
import { ProjectStatus, ProjectPriority } from "../../entities/project.entity";

export class CreateProjectDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;

  @IsEnum(ProjectPriority)
  @IsOptional()
  priority?: ProjectPriority;

  @IsISO8601()
  @IsOptional()
  start_date?: string;

  @IsISO8601()
  @IsOptional()
  end_date?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  collaborator_ids?: string[];

  @IsNumber()
  @Min(0.01, { message: "Total amount must be greater than 0" })
  totalAmount: number;
}
