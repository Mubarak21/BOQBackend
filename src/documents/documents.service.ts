import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as path from "path";
import * as fs from "fs";
import { createReadStream, type ReadStream } from "fs";
import { ProjectDocument, DocumentCategory } from "../entities/project-document.entity";
import { Project } from "../entities/project.entity";
import { User, UserRole } from "../entities/user.entity";

@Injectable()
export class DocumentsService {
  private readonly uploadsDir = path.join(process.cwd(), "uploads", "documents");

  constructor(
    @InjectRepository(ProjectDocument)
    private documentRepository: Repository<ProjectDocument>,
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
  ) {}

  private hasProjectAccess(project: Project, userId: string): boolean {
    return (
      project.owner_id === userId ||
      (project.collaborators || []).some((c) => c.id === userId) ||
      false
    );
  }

  private isConsultant(user: User): boolean {
    return user.role?.toLowerCase() === UserRole.CONSULTANT.toLowerCase();
  }

  async getProjectsWithDocumentCount(user: User): Promise<{ id: string; title: string; documentCount: number }[]> {
    let projects: Project[];
    if (this.isConsultant(user)) {
      projects = await this.projectsRepository.find({
        relations: ["collaborators"],
        order: { updated_at: "DESC" },
      });
    } else {
      projects = await this.projectsRepository
        .createQueryBuilder("p")
        .leftJoinAndSelect("p.collaborators", "c")
        .where("p.owner_id = :userId", { userId: user.id })
        .orWhere("c.id = :userId", { userId: user.id })
        .orderBy("p.updated_at", "DESC")
        .getMany();
    }
    const counts = await this.documentRepository
      .createQueryBuilder("d")
      .select("d.project_id", "project_id")
      .addSelect("COUNT(d.id)", "count")
      .groupBy("d.project_id")
      .getRawMany();
    const countMap = new Map(counts.map((r) => [r.project_id, parseInt(r.count, 10)]));
    return projects.map((p) => ({
      id: p.id,
      title: p.title || "Untitled Project",
      documentCount: countMap.get(p.id) || 0,
    }));
  }

  async findByProject(projectId: string, user: User): Promise<ProjectDocument[]> {
    const project = await this.projectsRepository.findOne({
      where: { id: projectId },
      relations: ["collaborators"],
    });
    if (!project) {
      throw new NotFoundException("Project not found");
    }
    if (!this.isConsultant(user) && !this.hasProjectAccess(project, user.id)) {
      throw new ForbiddenException("You do not have access to this project");
    }
    return this.documentRepository.find({
      where: { project_id: projectId },
      relations: ["uploadedByUser"],
      order: { created_at: "DESC" },
    });
  }

  async create(
    projectId: string,
    user: User,
    file: Express.Multer.File,
    displayName?: string,
    description?: string,
    category?: DocumentCategory,
  ): Promise<ProjectDocument> {
    const project = await this.projectsRepository.findOne({
      where: { id: projectId },
      relations: ["collaborators"],
    });
    if (!project) {
      throw new NotFoundException("Project not found");
    }
    if (!this.isConsultant(user) && !this.hasProjectAccess(project, user.id)) {
      throw new ForbiddenException("You do not have access to this project");
    }
    const projectDir = path.join(this.uploadsDir, projectId);
    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true });
    }
    const safeName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const filePath = path.join(projectDir, safeName);
    fs.writeFileSync(filePath, file.buffer);
    const relativePath = path.join("documents", projectId, safeName).replace(/\\/g, "/");
    const doc = this.documentRepository.create({
      project_id: projectId,
      file_name: file.originalname,
      display_name: displayName ?? null,
      description: description ?? null,
      file_path: "/uploads/" + relativePath,
      mime_type: file.mimetype ?? null,
      category: category ?? DocumentCategory.OTHER,
      uploaded_by: user.id,
    });
    return this.documentRepository.save(doc);
  }

  async findOne(id: string, user: User): Promise<ProjectDocument> {
    const doc = await this.documentRepository.findOne({
      where: { id },
      relations: ["project", "project.collaborators", "uploadedByUser"],
    });
    if (!doc) {
      throw new NotFoundException("Document not found");
    }
    const project = doc.project;
    if (!this.isConsultant(user) && !this.hasProjectAccess(project, user.id)) {
      throw new ForbiddenException("You do not have access to this document");
    }
    return doc;
  }

  async remove(id: string, user: User): Promise<void> {
    const doc = await this.findOne(id, user);
    const fullPath = path.join(process.cwd(), doc.file_path.replace(/^\//, "").replace(/\//g, path.sep));
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
    await this.documentRepository.remove(doc);
  }

  /**
   * Get a readable stream and metadata for downloading a document. Used by GET /documents/:id/download.
   */
  async getFileStream(
    id: string,
    user: User,
  ): Promise<{ stream: ReadStream; fileName: string; mimeType: string | null }> {
    const doc = await this.findOne(id, user);
    const fullPath = path.join(process.cwd(), doc.file_path.replace(/^\//, "").replace(/\//g, path.sep));
    if (!fs.existsSync(fullPath)) {
      throw new NotFoundException("File not found on server");
    }
    const fileName = doc.display_name || doc.file_name;
    const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    return {
      stream: createReadStream(fullPath),
      fileName: safeFileName,
      mimeType: doc.mime_type,
    };
  }
}
