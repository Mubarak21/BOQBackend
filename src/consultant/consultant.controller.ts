import {
  Controller,
  Get,
  Param,
  Query,
  Post,
  Body,
  Request,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import { ProjectsService } from "../projects/projects.service";
import { CommentsService } from "../comments/comments.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RequestWithUser } from "../auth/interfaces/request-with-user.interface";

@Controller("consultant")
@UseGuards(JwtAuthGuard)
export class ConsultantController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly commentsService: CommentsService
  ) {}

  // GET /consultant/projects — List all projects (summary info) with pagination
  @Get("projects")
  async getAllProjects(
    @Request() req: RequestWithUser,
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 10,
    @Query("search") search?: string,
    @Query("status") status?: string
  ) {
    try {
      const result = await this.projectsService.getAllConsultantProjectsPaginated(
        req.user.id,
        page,
        limit,
        search,
        status
      );

      return result;
    } catch (error) {
      console.error('[ConsultantController] GET /consultant/projects - Error:', {
        userId: req.user.id,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  // GET /consultant/projects/:id — Project details
  @Get("projects/:id")
  async getProjectDetails(
    @Param("id") id: string,
    @Request() req: RequestWithUser
  ) {
    return this.projectsService.getConsultantProjectDetails(id);
  }

  // GET /consultant/projects/:id/phases — Phases for a project
  @Get("projects/:id/phases")
  async getProjectPhases(
    @Param("id") id: string,
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 10,
    @Request() req: RequestWithUser
  ) {
    return this.projectsService.getConsultantProjectPhasesPaginated(id, {
      page,
      limit,
    });
  }

  // GET /consultant/tasks?projectId=... — Tasks for a project
  @Get("tasks")
  async getProjectTasks(
    @Query("projectId") projectId: string,
    @Request() req: RequestWithUser
  ) {
    if (!projectId) {
      throw new BadRequestException("projectId query parameter is required");
    }
    return this.projectsService.getConsultantProjectTasks(projectId);
  }

  // GET /consultant/feedback?projectId=... — Feedback/notes for a project
  @Get("feedback")
  async getProjectFeedback(
    @Query("projectId") projectId: string,
    @Request() req: RequestWithUser
  ) {
    if (!projectId) {
      throw new BadRequestException("projectId query parameter is required");
    }
    return this.commentsService.listConsultantFeedbackByProject(projectId);
  }

  // POST /consultant/feedback — Create feedback/notes
  @Post("feedback")
  async createFeedback(
    @Body() body: { projectId: string; content: string },
    @Request() req: RequestWithUser
  ) {
    if (!body.projectId) {
      throw new BadRequestException("projectId is required");
    }
    if (!body.content || body.content.trim().length === 0) {
      throw new BadRequestException("content is required and cannot be empty");
    }
    return this.commentsService.createConsultantFeedback(
      body.projectId,
      body.content.trim(),
      req.user
    );
  }

  // TODO: Implement endpoints for documents, signoffs, inspections, analytics
}
