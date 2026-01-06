import { IsNotEmpty, IsString } from 'class-validator';

export class FileUploadDto {
  @IsNotEmpty()
  @IsString()
  projectId?: string;
}

