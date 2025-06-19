import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsISO8601,
  Min,
  Max,
} from "class-validator";
import { TaskStatus, TaskPriority } from "../../entities/task.entity";

export class CreatePhaseDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  work_description?: string;

  @IsString()
  @IsOptional()
  deliverables?: string;

  @IsString()
  @IsOptional()
  requirements?: string;

  @IsString()
  @IsOptional()
  risks?: string;

  @IsString()
  @IsOptional()
  dependencies?: string;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @IsISO8601()
  @IsOptional()
  start_date?: string;

  @IsISO8601()
  @IsOptional()
  end_date?: string;

  @IsNumber()
  @Min(0)
  budget: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  spent?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  progress?: number;

  @IsString()
  @IsOptional()
  assignee_id?: string;

  @IsString()
  @IsOptional()
  parent_phase_id?: string;
}
