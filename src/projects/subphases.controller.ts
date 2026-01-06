import {
  Controller,
  Patch,
  Post,
  Param,
  Body,
  HttpCode,
  NotFoundException,
  Req,
  UseGuards,
  Get,
  Query,
} from "@nestjs/common";
import { SubPhasesService } from "./subphases.service";
import { SubPhase } from "../entities/sub-phase.entity";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RequestWithUser } from "../auth/interfaces/request-with-user.interface";
import { CreateSubPhaseDto } from "./dto/create-sub-phase.dto";

@UseGuards(JwtAuthGuard)
@Controller("subphases")
export class SubPhasesController {
  constructor(private readonly subPhasesService: SubPhasesService) {}

  @Post("phase/:phaseId")
  @HttpCode(201)
  async createSubPhase(
    @Param("phaseId") phaseId: string,
    @Body() createDto: CreateSubPhaseDto,
    @Req() req: RequestWithUser
  ): Promise<SubPhase> {
    return await this.subPhasesService.create(phaseId, createDto, req.user);
  }

  @Post("subphase/:parentSubPhaseId")
  @HttpCode(201)
  async createNestedSubPhase(
    @Param("parentSubPhaseId") parentSubPhaseId: string,
    @Body() createDto: CreateSubPhaseDto,
    @Req() req: RequestWithUser
  ): Promise<SubPhase> {
    // Get the parent sub-phase to find its phase
    const parentSubPhase = await this.subPhasesService.findOne(parentSubPhaseId);
    if (!parentSubPhase) {
      throw new NotFoundException("Parent sub-phase not found");
    }
    
    // Create nested sub-phase with parentSubPhaseId
    return await this.subPhasesService.create(
      parentSubPhase.phase_id,
      { ...createDto, parentSubPhaseId },
      req.user
    );
  }

  @Patch(":id")
  @HttpCode(200)
  async updateSubPhase(
    @Param("id") id: string,
    @Body("isCompleted") isCompleted: boolean,
    @Req() req: RequestWithUser
  ): Promise<SubPhase> {
    const updated = await this.subPhasesService.update(
      id,
      { isCompleted },
      req.user
    );
    if (!updated) throw new NotFoundException("SubPhase not found");
    return updated;
  }

  @Get("search")
  async searchSubPhases(
    @Query("projectId") projectId: string,
    @Query("search") search: string,
    @Req() req: RequestWithUser
  ) {
    if (!projectId) {
      throw new NotFoundException("projectId query parameter is required");
    }
    if (!search || search.trim().length === 0) {
      return [];
    }
    return this.subPhasesService.searchSubPhases(projectId, search);
  }
}
