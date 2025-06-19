import { IsString, IsOptional, IsUUID } from "class-validator";

export class CreateCommentDto {
  @IsString()
  content: string;

  @IsUUID()
  @IsOptional()
  project_id?: string;

  @IsUUID()
  @IsOptional()
  task_id?: string;
}
