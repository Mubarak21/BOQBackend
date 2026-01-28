import { IsString, IsOptional, IsUUID, IsBoolean } from "class-validator";

export class CreateSubPhaseDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  parentSubPhaseId?: string;

  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;
}
