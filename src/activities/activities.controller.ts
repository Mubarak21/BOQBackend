import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  Param,
} from "@nestjs/common";
import { ActivitiesService } from "./activities.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("activities")
@UseGuards(JwtAuthGuard)
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get()
  async getRecentActivities(
    @Query("limit") limit?: string,
    @Query("offset") offset?: string
  ) {
    return this.activitiesService.getRecentActivities(
      limit ? Number(limit) : undefined,
      offset ? Number(offset) : undefined
    );
  }

  @Get("project/:projectId")
  async getProjectActivities(
    @Param("projectId") projectId: string,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string
  ) {
    return this.activitiesService.getProjectActivities(
      projectId,
      limit ? Number(limit) : undefined,
      offset ? Number(offset) : undefined
    );
  }

  @Get("user")
  async getUserActivities(
    @Request() req,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string
  ) {
    return this.activitiesService.getUserActivities(
      req.user.id,
      limit ? Number(limit) : undefined,
      offset ? Number(offset) : undefined
    );
  }

  @Get("phase/:phaseId")
  async getPhaseActivities(
    @Param("phaseId") phaseId: string,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string
  ) {
    return this.activitiesService.getPhaseActivities(
      phaseId,
      limit ? Number(limit) : undefined,
      offset ? Number(offset) : undefined
    );
  }
}
