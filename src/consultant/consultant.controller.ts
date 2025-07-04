import {
  Controller,
  Get,
  Param,
  Query,
  Post,
  Body,
  Request,
  UseGuards,
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

  // GET /consultant/projects — List all projects (summary info)
  @Get("projects")
  async getAllProjects(@Request() req: RequestWithUser) {
    return this.projectsService.getAllConsultantProjects();
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
    @Request() req: RequestWithUser
  ) {
    return this.projectsService.getConsultantProjectPhases(id);
  }

  // GET /consultant/tasks?projectId=... — Tasks for a project
  @Get("tasks")
  async getProjectTasks(
    @Query("projectId") projectId: string,
    @Request() req: RequestWithUser
  ) {
    return this.projectsService.getConsultantProjectTasks(projectId);
  }

  // GET /consultant/feedback?projectId=... — Feedback/notes for a project
  @Get("feedback")
  async getProjectFeedback(
    @Query("projectId") projectId: string,
    @Request() req: RequestWithUser
  ) {
    return this.commentsService.listConsultantFeedbackByProject(projectId);
  }

  // POST /consultant/feedback — Create feedback/notes
  @Post("feedback")
  async createFeedback(
    @Body() body: { projectId: string; content: string },
    @Request() req: RequestWithUser
  ) {
    return this.commentsService.createConsultantFeedback(
      body.projectId,
      body.content,
      req.user
    );
  }

  // TODO: Implement endpoints for documents, signoffs, inspections, analytics
}
