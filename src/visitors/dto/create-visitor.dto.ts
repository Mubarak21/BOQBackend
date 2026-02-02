import { IsDateString, IsEnum, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { VisitorPriority } from "../../entities/visitor.entity";

export class CreateVisitorDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  visitor_name: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  company?: string;

  @IsDateString()
  visit_date: string;

  @IsEnum(VisitorPriority)
  priority: VisitorPriority;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  purpose?: string;
}
