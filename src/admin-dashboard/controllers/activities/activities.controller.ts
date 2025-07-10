import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { ActivitiesService } from "../../../activities/activities.service";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../../auth/guards/roles.guard";
import { Roles } from "../../../auth/decorators/roles.decorator";
import { UserRole } from "../../../entities/user.entity";

@Controller("admin/activities")
@UseGuards(JwtAuthGuard)
export class AdminActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  // 1. Paginated, filterable, searchable list
  @Get()
  async listActivities(
    @Query("userId") userId?: string,
    @Query("type") type?: string,
    @Query("dateFrom") dateFrom?: string,
    @Query("dateTo") dateTo?: string,
    @Query("projectId") projectId?: string,
    @Query("search") search: string = "",
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 20
  ) {
    return this.activitiesService.adminList({
      userId,
      type,
      dateFrom,
      dateTo,
      projectId,
      search,
      page,
      limit,
    });
  }

  // 2. Activity details
  @Get(":id")
  async getActivity(@Param("id") id: string) {
    return this.activitiesService.adminGetDetails(id);
  }
}
