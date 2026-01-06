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
  Query,
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
import { ComplaintsService } from "../complaints-penalties/complaints.service";
import { PenaltiesService } from "../complaints-penalties/penalties.service";
import { EvidenceService } from "./evidence.service";
import { EvidenceType } from "../entities/phase-evidence.entity";
import { UserRole } from "../entities/user.entity";
import { BoqParserService } from "./boq-parser.service";
import { BoqProgressGateway } from "./boq-progress.gateway";
import { FileValidationPipe } from "./pipes/file-validation.pipe";

@Controller("projects")
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly usersService: UsersService,
    private readonly complaintsService: ComplaintsService,
    private readonly penaltiesService: PenaltiesService,
    private readonly evidenceService: EvidenceService,
    private readonly boqParserService: BoqParserService,
    private readonly boqProgressGateway: BoqProgressGateway
  ) {}

  @Post()
  create(@Body() createProjectDto: CreateProjectDto, @Request() req) {
    return this.projectsService.create(createProjectDto, req.user);
  }

  @Get()
  async findAll(
    @Req() req: RequestWithUser,
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 10,
    @Query("search") search?: string,
    @Query("status") status?: string
  ) {
    console.log(
      "🔍 User Projects - User ID:",
      req.user.id,
      "Role:",
      req.user.role,
      "Page:",
      page,
      "Limit:",
      limit
    );

    // Use paginated methods
    let result;
    if (req.user.role === UserRole.CONTRACTOR || req.user.role === UserRole.SUB_CONTRACTOR) {
      result = await this.projectsService.findAllPaginated({
        page,
        limit,
        search,
        status,
      });
    } else {
      result = await this.projectsService.findUserProjectsPaginated(
        req.user.id,
        {
          page,
          limit,
          search,
          status,
        }
      );
    }

    console.log(
      "📊 User Projects Found:",
      result.items.length,
      "of",
      result.total
    );

    // Transform to response format
    const items = await Promise.all(
      result.items.map((p) => this.projectsService.getProjectResponse(p))
    );

    return {
      items,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
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

  @Post("boq/preview")
  @UseInterceptors(FileInterceptor("file"))
  async previewBoq(
    @UploadedFile(new FileValidationPipe()) file: Express.Multer.File,
    @Req() req: RequestWithUser,
    @Query("roomId") roomId?: string
  ) {
    // Parse BOQ file using the new stateful parser
    const parseResult = await this.boqParserService.parseBoqFile(
      file,
      roomId
        ? (progress) => {
            this.boqProgressGateway.emitProgress(roomId, progress);
          }
        : undefined
    );

    // Return cleaned JSON with section mappings for preview
    return {
      items: parseResult.items,
      totalAmount: parseResult.totalAmount,
      sections: parseResult.sections,
      uncertainHeaders: parseResult.uncertainHeaders,
      metadata: parseResult.metadata,
      // Format for grid display
      gridData: parseResult.items.map((item) => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        rate: item.rate,
        amount: item.amount,
        section: item.section || "",
        subSection: item.subSection || "",
        rowIndex: item.rowIndex,
      })),
    };
  }

  @Post(":id/boq")
  @UseInterceptors(FileInterceptor("file"))
  async uploadBoq(
    @Param("id") id: string,
    @UploadedFile(new FileValidationPipe()) file: Express.Multer.File,
    @Req() req: RequestWithUser,
    @Query("roomId") roomId?: string
  ): Promise<ProcessBoqResult> {
    // Parse BOQ file using the new stateful parser with progress tracking
    const parseResult = await this.boqParserService.parseBoqFile(
      file,
      roomId
        ? (progress) => {
            this.boqProgressGateway.emitProgress(roomId, progress);
          }
        : undefined
    );

    // Convert parsed items to the format expected by processBoqFile
    // Preserve the description from the parsed item and ensure it's in the data
    const processedData = parseResult.items.map((item) => {
      const row = { ...item.rawData };
      // Ensure description is preserved - use the extracted description if available
      // Try to find the description column or add it explicitly
      const descKey = Object.keys(row).find(key => 
        key.toLowerCase().includes('desc') || 
        key.toLowerCase().includes('description') ||
        key.toLowerCase().includes('item')
      );
      
      // If we have an extracted description, use it
      if (item.description && item.description.trim() !== "") {
        // Set it in the most likely column name
        if (descKey) {
          row[descKey] = item.description;
        } else {
          // Add it as 'Description' if no description column found
          row['Description'] = item.description;
        }
      }
      
      return {
        ...row,
        section: item.section,
        subSection: item.subSection,
        // Also add explicit fields for easier access
        _extractedDescription: item.description,
        _extractedUnit: item.unit,
        _extractedQuantity: item.quantity,
      };
    });

    // Update the service method to accept parsed data
    return this.projectsService.processBoqFileFromParsedData(
      id,
      processedData,
      parseResult.totalAmount,
      req.user.id
    );
  }

  @Post(":id/phases")
  async createPhase(
    @Param("id") id: string,
    @Body() createPhaseDto: CreatePhaseDto,
    @Req() req: RequestWithUser
  ): Promise<Phase> {
    return this.projectsService.createPhase(id, createPhaseDto, req.user.id);
  }

  // BOQ-specific routes MUST come before generic :id/phases route
  @Get(":id/phases/boq-drafts")
  async getBoqDraftPhases(
    @Param("id") id: string,
    @Req() req: RequestWithUser
  ) {
    return this.projectsService.getBoqDraftPhases(id, req.user.id);
  }

  @Post(":id/phases/activate-boq")
  async activateBoqPhases(
    @Param("id") id: string,
    @Body() body: { phaseIds: string[] },
    @Req() req: RequestWithUser
  ) {
    return this.projectsService.activateBoqPhases(id, body.phaseIds, req.user.id);
  }

  @Get(":id/phases")
  async getProjectPhases(
    @Param("id") id: string,
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 10,
    @Req() req: RequestWithUser
  ) {
    return this.projectsService.getProjectPhasesPaginated(id, req.user.id, {
      page,
      limit,
    });
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

  // Removed insecure endpoint - use admin/projects instead

  @Post(":projectId/join-request")
  async createJoinRequest(
    @Param("projectId") projectId: string,
    @Request() req
  ) {
    return this.projectsService.createJoinRequest(projectId, req.user.id);
  }

  @Get(":projectId/join-requests")
  async listJoinRequestsForProject(
    @Param("projectId") projectId: string,
    @Request() req
  ) {
    return this.projectsService.listJoinRequestsForProject(
      projectId,
      req.user.id
    );
  }

  @Post(":projectId/join-requests/:requestId/approve")
  async approveJoinRequest(
    @Param("projectId") projectId: string,
    @Param("requestId") requestId: string,
    @Request() req
  ) {
    return this.projectsService.approveJoinRequest(
      projectId,
      requestId,
      req.user.id
    );
  }

  @Post(":projectId/join-requests/:requestId/deny")
  async denyJoinRequest(
    @Param("projectId") projectId: string,
    @Param("requestId") requestId: string,
    @Request() req
  ) {
    return this.projectsService.denyJoinRequest(
      projectId,
      requestId,
      req.user.id
    );
  }

  @Get("/my/join-requests")
  async listMyJoinRequests(@Request() req) {
    return this.projectsService.listMyJoinRequests(req.user.id);
  }

  @Get("/owner/join-requests")
  async listJoinRequestsForOwner(@Request() req) {
    return this.projectsService.listJoinRequestsForOwner(req.user.id);
  }

  @Get(":id/available-phase-tasks")
  async getAvailablePhaseTasks(
    @Param("id") id: string,
    @Req() req: RequestWithUser
  ): Promise<any[]> {
    return this.projectsService.getAvailablePhaseTasks(id, req.user.id);
  }

  @Get(":id/complaints")
  async getProjectComplaints(@Param("id") id: string) {
    return this.complaintsService.findByProject(id);
  }

  @Get(":id/penalties")
  async getProjectPenalties(@Param("id") id: string) {
    return this.penaltiesService.findByProject(id);
  }

  @Post(":id/phases/:phaseId/evidence")
  @UseInterceptors(FileInterceptor("file"))
  async uploadEvidence(
    @Param("id") projectId: string,
    @Param("phaseId") phaseId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: { subPhaseId?: string; type: string; notes?: string },
    @Req() req: RequestWithUser
  ) {
    return this.evidenceService.uploadEvidence(
      phaseId,
      file,
      body.type as EvidenceType,
      body.notes,
      body.subPhaseId,
      req.user
    );
  }

  // Project Inventory Endpoints
  @Get(":id/inventory")
  async getProjectInventory(
    @Param("id") id: string,
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 10,
    @Query("category") category?: string,
    @Query("search") search?: string,
    @Req() req: RequestWithUser
  ) {
    return this.projectsService.getProjectInventory(id, req.user.id, {
      page,
      limit,
      category,
      search,
    });
  }

  @Post(":id/inventory")
  @UseInterceptors(
    FileInterceptor("picture", {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    })
  )
  async addProjectInventoryItem(
    @Param("id") id: string,
    @UploadedFile() pictureFile: Express.Multer.File | undefined,
    @Body() createInventoryDto: any,
    @Req() req: RequestWithUser
  ) {
    return this.projectsService.addProjectInventoryItem(
      id,
      createInventoryDto,
      req.user.id,
      pictureFile
    );
  }

  @Patch(":id/inventory/:inventoryId")
  async updateProjectInventoryItem(
    @Param("id") id: string,
    @Param("inventoryId") inventoryId: string,
    @Body() updateData: any,
    @Req() req: RequestWithUser
  ) {
    return this.projectsService.updateProjectInventoryItem(
      id,
      inventoryId,
      updateData,
      req.user.id
    );
  }

  @Delete(":id/inventory/:inventoryId")
  async deleteProjectInventoryItem(
    @Param("id") id: string,
    @Param("inventoryId") inventoryId: string,
    @Req() req: RequestWithUser
  ) {
    return this.projectsService.deleteProjectInventoryItem(
      id,
      inventoryId,
      req.user.id
    );
  }
}
