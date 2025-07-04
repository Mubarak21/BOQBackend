import { IsString, IsOptional } from "class-validator";

export class CreateSubPhaseDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;
}
