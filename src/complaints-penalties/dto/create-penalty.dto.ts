import { IsString, IsUUID, IsNumber, IsOptional, Min } from "class-validator";

export class CreatePenaltyDto {
  @IsUUID()
  project_id: string;

  @IsUUID()
  @IsOptional()
  phase_id?: string;

  @IsUUID()
  @IsOptional()
  complaint_id?: string;

  @IsUUID()
  assigned_to: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  reason: string;
}

