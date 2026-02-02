import { IsEnum, IsOptional, IsString } from "class-validator";
import { DocumentCategory } from "../../entities/project-document.entity";

export class CreateDocumentDto {
  @IsOptional()
  @IsString()
  display_name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(DocumentCategory)
  category?: DocumentCategory;
}
