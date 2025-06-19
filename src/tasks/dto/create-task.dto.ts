import {
  IsString,
  IsOptional,
  IsEnum,
  IsDate,
  IsUUID,
  IsInt,
  Min,
} from "class-validator";
import { TaskStatus, TaskPriority } from "../../entities/task.entity";

export class CreateTaskDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @IsDate()
  @IsOptional()
  due_date?: Date;

  @IsInt()
  @Min(0)
  @IsOptional()
  estimated_hours?: number;

  @IsUUID()
  project_id: string;

  @IsUUID()
  @IsOptional()
  assignee_id?: string;
}
