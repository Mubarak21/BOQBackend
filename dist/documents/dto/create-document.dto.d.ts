import { DocumentCategory } from "../../entities/project-document.entity";
export declare class CreateDocumentDto {
    display_name?: string;
    description?: string;
    category?: DocumentCategory;
}
