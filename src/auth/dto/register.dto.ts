import { IsString, IsOptional } from "class-validator";

export class RegisterDto {
  @IsOptional()
  @IsString()
  departmentId?: string;
}
