import { IsString, IsUUID, IsOptional } from "class-validator";

export class CreateComplaintDto {
  @IsUUID()
  project_id: string;

  @IsUUID()
  @IsOptional()
  phase_id?: string;

  @IsUUID()
  @IsOptional()
  sub_phase_id?: string;

  @IsString()
  title: string;

  @IsString()
  description: string;
}

