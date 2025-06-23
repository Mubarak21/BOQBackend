import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Req,
  ForbiddenException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ProjectsService, ProcessBoqResult } from "./projects.service";
import { CreateProjectDto } from "./dto/create-project.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { UsersService } from "../users/users.service";
import { RequestWithUser } from "../auth/interfaces/request-with-user.interface";
import { CreatePhaseDto } from "./dto/create-phase.dto";
import { UpdatePhaseDto } from "./dto/update-phase.dto";
import { Phase } from "../entities/phase.entity";
import {
  CollaborationRequest,
  CollaborationRequestStatus,
} from "../entities/collaboration-request.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

@Controller("projects")
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly usersService: UsersService,
    @InjectRepository(CollaborationRequest)
    private readonly collaborationRequestRepository: Repository<CollaborationRequest>
  ) {}

  @Post()
  create(@Body() createProjectDto: CreateProjectDto, @Request() req) {
    return this.projectsService.create(createProjectDto, req.user);
  }

  @Get()
  async findAll(@Request() req) {
    const all = req.query.all === "true";
    const projects = await this.projectsService.findAll(req.user.id, all);
    return projects;
  }

  @Get(":id")
  async findOne(@Param("id") id: string, @Req() req: RequestWithUser) {
    const project = await this.projectsService.findOne(id, req.user.id);
    return await this.projectsService.getProjectResponse(project);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @Request() req
  ) {
    return this.projectsService.update(id, updateProjectDto, req.user.id);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @Request() req) {
    return this.projectsService.remove(id, req.user.id);
  }

  @Post(":id/collaborators/:userId")
  async addCollaborator(
    @Param("id") id: string,
    @Param("userId") userId: string,
    @Request() req
  ) {
    const collaborator = await this.usersService.findOne(userId);
    return this.projectsService.addCollaborator(id, collaborator, req.user.id);
  }

  @Delete(":id/collaborators/:userId")
  removeCollaborator(
    @Param("id") id: string,
    @Param("userId") userId: string,
    @Request() req
  ) {
    return this.projectsService.removeCollaborator(id, userId, req.user.id);
  }

  @Post(":id/collaborators/invite")
  async inviteCollaborator(
    @Param("id") id: string,
    @Body("userId") userId: string,
    @Request() req
  ) {
    // Only owner can invite
    const project = await this.projectsService.findOne(id, req.user.id);
    if (project.owner_id !== req.user.id) {
      throw new ForbiddenException(
        "Only the project owner can invite collaborators"
      );
    }
    // Check if already a collaborator
    if (project.collaborators?.some((c) => c.id === userId)) {
      throw new BadRequestException("User is already a collaborator");
    }
    // Check if already has a pending request
    const existing = await this.collaborationRequestRepository.findOne({
      where: {
        projectId: id,
        userId,
        status: CollaborationRequestStatus.PENDING,
      },
    });
    if (existing) {
      throw new BadRequestException("User already has a pending invite");
    }
    // Create request
    const invite = this.collaborationRequestRepository.create({
      projectId: id,
      userId,
      inviterId: req.user.id,
      status: CollaborationRequestStatus.PENDING,
    });
    await this.collaborationRequestRepository.save(invite);
    // TODO: Notify user (stub)
    return { message: "Invitation sent" };
  }

  @Post(":id/boq")
  @UseInterceptors(FileInterceptor("file"))
  async uploadBoq(
    @Param("id") id: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: RequestWithUser
  ): Promise<ProcessBoqResult> {
    if (!file) {
      throw new BadRequestException("No file uploaded");
    }

    if (
      !file.mimetype.includes("spreadsheet") &&
      !file.mimetype.includes("excel")
    ) {
      throw new BadRequestException("File must be an Excel spreadsheet");
    }

    return this.projectsService.processBoqFile(id, file, req.user.id);
  }

  @Post(":id/phases")
  async createPhase(
    @Param("id") id: string,
    @Body() createPhaseDto: CreatePhaseDto,
    @Req() req: RequestWithUser
  ): Promise<Phase> {
    return this.projectsService.createPhase(id, createPhaseDto, req.user.id);
  }

  @Get(":id/phases")
  async getProjectPhases(
    @Param("id") id: string,
    @Req() req: RequestWithUser
  ): Promise<Phase[]> {
    return this.projectsService.getProjectPhases(id, req.user.id);
  }

  @Get("available-assignees")
  async getAvailableAssignees(@Request() req) {
    const projectId = req.query.projectId;
    if (!projectId) {
      throw new BadRequestException("projectId query parameter is required");
    }
    return this.projectsService.getAvailableAssignees(projectId);
  }

  @Patch(":projectId/phases/:phaseId")
  async updatePhase(
    @Param("projectId") projectId: string,
    @Param("phaseId") phaseId: string,
    @Body() updatePhaseDto: UpdatePhaseDto,
    @Req() req: RequestWithUser
  ): Promise<Phase> {
    return this.projectsService.updatePhase(
      projectId,
      phaseId,
      updatePhaseDto,
      req.user.id
    );
  }

  @Delete(":projectId/phases/:phaseId")
  async deletePhase(
    @Param("projectId") projectId: string,
    @Param("phaseId") phaseId: string,
    @Req() req: RequestWithUser
  ): Promise<{ message: string }> {
    await this.projectsService.deletePhase(projectId, phaseId, req.user.id);
    return { message: "Phase deleted successfully" };
  }

  @Post(":id/join")
  async joinProject(@Param("id") id: string, @Request() req) {
    return this.projectsService.joinProject(id, req.user);
  }

  @Get("all")
  findAllProjects() {
    return this.projectsService.findAllProjects();
  }
}
