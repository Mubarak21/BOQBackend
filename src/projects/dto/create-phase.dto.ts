import {
  IsString,
  IsOptional,
  IsNumber,
  IsISO8601,
  Min,
  Max,
  IsEnum,
} from "class-validator";
import { Type } from "class-transformer";
import { ValidateNested } from "class-validator";
import { CreateTaskDto } from "../../tasks/dto/create-task.dto";
import { CreateSubPhaseDto } from "./create-sub-phase.dto";
import { PhaseStatus } from "../../entities/phase.entity";

export class CreatePhaseDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

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

  @IsString()
  @IsOptional()
  priority?: string;

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  dueDate?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  budget?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  progress?: number;

  @IsEnum(PhaseStatus)
  @IsOptional()
  status?: PhaseStatus;

  @IsString()
  @IsOptional()
  parentPhaseId?: string;

  @IsString()
  @IsOptional()
  referenceTaskId?: string;

  @ValidateNested({ each: true })
  @Type(() => CreateTaskDto)
  @IsOptional()
  tasks?: CreateTaskDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateSubPhaseDto)
  subPhases?: CreateSubPhaseDto[];
}
