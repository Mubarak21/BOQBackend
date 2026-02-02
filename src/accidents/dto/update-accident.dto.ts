import { IsEnum, IsOptional, IsString } from "class-validator";
import { AccidentStatus } from "../../entities/accident.entity";

export class UpdateAccidentDto {
  @IsOptional()
  @IsEnum(AccidentStatus)
  status?: AccidentStatus;

  @IsOptional()
  @IsString()
  action_taken?: string;
}
