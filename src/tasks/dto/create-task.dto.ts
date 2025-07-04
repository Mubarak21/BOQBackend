import { IsString, IsOptional, IsUUID, IsNumber, Min } from "class-validator";
import { Type } from "class-transformer";
import { ValidateNested } from "class-validator";

export class CreateTaskDto {
  @IsString()
  description: string;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  quantity?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @IsUUID()
  project_id: string;

  @IsUUID()
  @IsOptional()
  phase_id?: string;

  @IsUUID()
  @IsOptional()
  id?: string;

  @ValidateNested({ each: true })
  @Type(() => CreateTaskDto)
  @IsOptional()
  subTasks?: CreateTaskDto[];
}
