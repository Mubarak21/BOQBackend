import { Repository } from "typeorm";
import { type ReadStream } from "fs";
import { ProjectDocument, DocumentCategory } from "../entities/project-document.entity";
import { Project } from "../entities/project.entity";
import { User } from "../entities/user.entity";
export declare class DocumentsService {
    private documentRepository;
    private projectsRepository;
    private readonly uploadsDir;
    constructor(documentRepository: Repository<ProjectDocument>, projectsRepository: Repository<Project>);
    private hasProjectAccess;
    private isConsultant;
    getProjectsWithDocumentCount(user: User): Promise<{
        id: string;
        title: string;
        documentCount: number;
    }[]>;
    findByProject(projectId: string, user: User): Promise<ProjectDocument[]>;
    create(projectId: string, user: User, file: Express.Multer.File, displayName?: string, description?: string, category?: DocumentCategory): Promise<ProjectDocument>;
    findOne(id: string, user: User): Promise<ProjectDocument>;
    remove(id: string, user: User): Promise<void>;
    getFileStream(id: string, user: User): Promise<{
        stream: ReadStream;
        fileName: string;
        mimeType: string | null;
    }>;
}
