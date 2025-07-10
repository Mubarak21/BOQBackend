import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ProjectsService } from "../../../projects/projects.service";
import { UsersService } from "../../../users/users.service";
import { ActivitiesService } from "../../../activities/activities.service";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../../auth/guards/roles.guard";
import { Roles } from "../../../auth/decorators/roles.decorator";
import { UserRole } from "../../../entities/user.entity";

@Controller("admin/dashboard")
@UseGuards(JwtAuthGuard)
export class AdminDashboardController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly usersService: UsersService,
    private readonly activitiesService: ActivitiesService
  ) {}

  // 1. Summary metrics
  @Get("metrics")
  async getMetrics() {
    const [totalProjects, totalUsers, totalActivities] = await Promise.all([
      this.projectsService.countAll(),
      this.usersService.countAll(),
      this.activitiesService.countAll(),
    ]);
    // Add more metrics as needed
    return {
      totalProjects,
      totalUsers,
      totalActivities,
    };
  }

  // 2. Recent activities
  @Get("recent-activities")
  async getRecentActivities(@Query("limit") limit: number = 10) {
    return this.activitiesService.getRecentActivities(limit);
  }

  // 3. Trends/analytics data for charts
  @Get("trends")
  async getTrends(
    @Query("metric") metric: string = "projects",
    @Query("period") period: string = "monthly"
  ) {
    switch (metric) {
      case "projects":
        return this.projectsService.getTrends(period);
      case "users":
        return this.usersService.getTrends(period);
      case "activities":
        return this.activitiesService.getTrends(period);
      default:
        return { error: "Invalid metric" };
    }
  }

  // 4. Top/active users
  @Get("top-users")
  async getTopUsers(@Query("limit") limit: number = 5) {
    return this.usersService.getTopActiveUsers(limit);
  }

  // 4. Top/active projects
  @Get("top-projects")
  async getTopProjects(@Query("limit") limit: number = 5) {
    return this.projectsService.getTopActiveProjects(limit);
  }
}
