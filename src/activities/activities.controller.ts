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
    @Query("limit") limit?: number,
    @Query("offset") offset?: number
  ) {
    return this.activitiesService.getRecentActivities(limit, offset);
  }

  @Get("project/:projectId")
  async getProjectActivities(
    @Param("projectId") projectId: string,
    @Query("limit") limit?: number,
    @Query("offset") offset?: number
  ) {
    return this.activitiesService.getProjectActivities(
      projectId,
      limit,
      offset
    );
  }

  @Get("user")
  async getUserActivities(
    @Request() req,
    @Query("limit") limit?: number,
    @Query("offset") offset?: number
  ) {
    return this.activitiesService.getUserActivities(req.user.id, limit, offset);
  }
}
