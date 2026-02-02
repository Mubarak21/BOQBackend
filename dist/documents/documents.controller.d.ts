import { StreamableFile } from "@nestjs/common";
import { DocumentsService } from "./documents.service";
import { RequestWithUser } from "../auth/interfaces/request-with-user.interface";
export declare class DocumentsController {
    private readonly documentsService;
    constructor(documentsService: DocumentsService);
    getProjectsWithDocumentCount(req: RequestWithUser): Promise<{
        id: string;
        title: string;
        documentCount: number;
    }[]>;
    findByProject(projectId: string, req: RequestWithUser): Promise<import("../entities/project-document.entity").ProjectDocument[]>;
    create(projectId: string, req: RequestWithUser, file: Express.Multer.File, displayName?: string, description?: string, category?: string): Promise<import("../entities/project-document.entity").ProjectDocument>;
    download(id: string, req: RequestWithUser): Promise<StreamableFile>;
    findOne(id: string, req: RequestWithUser): Promise<import("../entities/project-document.entity").ProjectDocument>;
    remove(id: string, req: RequestWithUser): Promise<void>;
}
