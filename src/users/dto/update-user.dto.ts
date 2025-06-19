import { IsString, IsOptional, IsObject } from "class-validator";

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  display_name?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsString()
  @IsOptional()
  avatar_url?: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsObject()
  @IsOptional()
  notification_preferences?: {
    email: boolean;
    project_updates: boolean;
    task_updates: boolean;
  };
}
