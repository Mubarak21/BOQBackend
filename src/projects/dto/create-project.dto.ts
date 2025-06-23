import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsISO8601,
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

  @IsString()
  @IsOptional()
  boq_file?: string; // Base64 encoded BOQ file

  @IsString()
  @IsOptional()
  boq_filename?: string;

  @IsString()
  @IsOptional()
  boq_mimetype?: string;

  @IsOptional()
  totalAmount?: number;
}
