import { IsString, IsOptional, IsUUID } from "class-validator";

export class CreateSubPhaseDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  parentSubPhaseId?: string;
}
