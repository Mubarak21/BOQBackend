import {
  IsEmail,
  IsString,
  MinLength,
  IsNotEmpty,
  IsOptional,
  IsObject,
} from "class-validator";

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  display_name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsString()
  @IsOptional()
  avatar_url?: string;

  @IsObject()
  @IsOptional()
  notification_preferences?: {
    email: boolean;
    project_updates: boolean;
    task_updates: boolean;
  };

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;
}
