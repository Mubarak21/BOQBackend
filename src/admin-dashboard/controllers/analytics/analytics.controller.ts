import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ProjectsService } from "../../../projects/projects.service";
import { UsersService } from "../../../users/users.service";
import { ActivitiesService } from "../../../activities/activities.service";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../../auth/guards/roles.guard";
import { Roles } from "../../../auth/decorators/roles.decorator";
import { UserRole } from "../../../entities/user.entity";

@Controller("admin/analytics")
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

  @Get("user-signups")
  async userSignups(
    @Query("period") period: string = "monthly",
    @Query("from") from?: string,
    @Query("to") to?: string
  ) {
    return this.usersService.getTrends(period, from, to);
  }

  @Get("activities")
  async activities(
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

  // 2. Grouped: Users by role
  @Get("users-by-role")
  async usersByRole() {
    return this.usersService.getGroupedByRole();
  }

  // 3. Comparative: User growth
  @Get("user-growth")
  async userGrowth(@Query("compare") compare: string = "month") {
    return this.usersService.getUserGrowth(compare);
  }

  // 4. (Optional) Add more custom analytics endpoints as needed
}
