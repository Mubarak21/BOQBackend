import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { AccidentSeverity } from "../../entities/accident.entity";

export class CreateAccidentDto {
  @IsDateString()
  accident_date: string;

  @IsString()
  description: string;

  @IsEnum(AccidentSeverity)
  severity: AccidentSeverity;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  injured_count?: number;

  @IsOptional()
  @IsString()
  action_taken?: string;
}
