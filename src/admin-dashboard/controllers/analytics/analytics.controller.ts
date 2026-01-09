import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ProjectsService } from "../../../projects/projects.service";
import { UsersService } from "../../../users/users.service";
import { ActivitiesService } from "../../../activities/activities.service";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";

@Controller("consultant/analytics")
@UseGuards(JwtAuthGuard)
export class AdminAnalyticsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly usersService: UsersService,
    private readonly activitiesService: ActivitiesService
  ) {}

  // Fix getTrends calls
  @Get("projects-created")
  async projectsCreated(
    @Query("period") period: string = "monthly",
    @Query("from") from?: string,
    @Query("to") to?: string
  ) {
    return this.projectsService.getTrends(period, from, to);
  }

  @Get("users-created")
  async usersCreated(
    @Query("period") period: string = "monthly",
    @Query("from") from?: string,
    @Query("to") to?: string
  ) {
    return this.usersService.getTrends(period, from, to);
  }

  @Get("activities-logged")
  async activitiesLogged(
    @Query("period") period: string = "monthly",
    @Query("from") from?: string,
    @Query("to") to?: string
  ) {
    return this.activitiesService.getTrends(period, from, to);
  }

  // Stubs for missing service methods
  // ... implement getGroupedByStatus, getGroupedByRole, getUserGrowth in the respective services ...

  // 2. Grouped: Projects by status
  @Get("projects-by-status")
  async projectsByStatus() {
    return this.projectsService.getGroupedByStatus();
  }

  // 3. Grouped: Users by role
  @Get("users-by-role")
  async usersByRole() {
    return this.usersService.getGroupedByRole();
  }

  // 4. Growth metrics
  @Get("user-growth")
  async userGrowth(@Query("compare") compare: string = "month") {
    return this.usersService.getUserGrowth(compare);
  }

  // Missing endpoints from frontend documentation
  @Get("project-completion")
  async projectCompletion(
    @Query("period") period: string = "daily",
    @Query("from") from?: string,
    @Query("to") to?: string
  ) {
    return this.projectsService.getProjectCompletionTrends(period, from, to);
  }

  @Get("user-engagement")
  async userEngagement(
    @Query("period") period: string = "daily",
    @Query("from") from?: string,
    @Query("to") to?: string
  ) {
    return this.usersService.getUserEngagementMetrics(period, from, to);
  }

  // 4. (Optional) Add more custom analytics endpoints as needed
}
