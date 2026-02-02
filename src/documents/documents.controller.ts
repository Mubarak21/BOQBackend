import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  StreamableFile,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { DocumentsService } from "./documents.service";
import { RequestWithUser } from "../auth/interfaces/request-with-user.interface";
import { DocumentCategory } from "../entities/project-document.entity";

@Controller("documents")
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get("projects")
  getProjectsWithDocumentCount(@Request() req: RequestWithUser) {
    return this.documentsService.getProjectsWithDocumentCount(req.user);
  }

  @Get("project/:projectId")
  findByProject(
    @Param("projectId") projectId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.documentsService.findByProject(projectId, req.user);
  }

  @Post("project/:projectId")
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: 25 * 1024 * 1024 },
    }),
  )
  create(
    @Param("projectId") projectId: string,
    @Request() req: RequestWithUser,
    @UploadedFile() file: Express.Multer.File,
    @Body("display_name") displayName?: string,
    @Body("description") description?: string,
    @Body("category") category?: string,
  ) {
    if (!file) {
      throw new BadRequestException("File is required");
    }
    const categoryEnum = category && Object.values(DocumentCategory).includes(category as DocumentCategory)
      ? (category as DocumentCategory)
      : undefined;
    return this.documentsService.create(
      projectId,
      req.user,
      file,
      displayName || undefined,
      description || undefined,
      categoryEnum,
    );
  }

  @Get(":id/download")
  async download(
    @Param("id") id: string,
    @Request() req: RequestWithUser,
  ): Promise<StreamableFile> {
    const { stream, fileName, mimeType } = await this.documentsService.getFileStream(id, req.user);
    return new StreamableFile(stream, {
      type: mimeType || "application/octet-stream",
      disposition: `attachment; filename="${fileName}"`,
    });
  }

  @Get(":id")
  findOne(@Param("id") id: string, @Request() req: RequestWithUser) {
    return this.documentsService.findOne(id, req.user);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @Request() req: RequestWithUser) {
    return this.documentsService.remove(id, req.user);
  }
}
