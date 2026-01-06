import { IsString, IsEmail, IsOptional, MinLength } from "class-validator";

export class AdminRegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsOptional()
  display_name?: string;
}
