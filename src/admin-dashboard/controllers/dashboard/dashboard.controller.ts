import { Controller, Get, Query, UseGuards, Request } from "@nestjs/common";
import { ProjectsService } from "../../../projects/projects.service";
import { ProjectDashboardService } from "../../../projects/services/project-dashboard.service";
import { UsersService } from "../../../users/users.service";
import { ActivitiesService } from "../../../activities/activities.service";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { RequestWithUser } from "../../../auth/interfaces/request-with-user.interface";

@Controller("consultant/dashboard")
@UseGuards(JwtAuthGuard)
export class AdminDashboardController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly projectDashboardService: ProjectDashboardService,
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

    const metrics = {
      totalProjects,
      totalUsers,
      totalActivities,
    };


    return metrics;
  }

  // Comprehensive stats endpoint for consultant dashboard - Optimized with database aggregations
  @Get("stats")
  async getStats(@Request() req: RequestWithUser) {
    try {
    // Use optimized aggregation methods instead of loading all projects
    const [
      projectStats,
      phaseStats,
      teamMembersCount,
      monthlyGrowth
    ] = await Promise.all([
      this.projectDashboardService.getDashboardProjectStats(),
      this.projectDashboardService.getDashboardPhaseStats(),
      this.projectDashboardService.getDashboardTeamMembersCount(),
      this.projectDashboardService.getDashboardMonthlyGrowth()
    ]);

    const stats = {
      totalProjects: projectStats.total,
      activeProjects: projectStats.active,
      completedProjects: projectStats.completed,
      totalValue: projectStats.totalValue,
      monthlyGrowth: monthlyGrowth,
      teamMembers: teamMembersCount,
      phaseStats: {
          totalPhases: phaseStats.total || 0,
          completedPhases: phaseStats.completed || 0,
          inProgressPhases: phaseStats.inProgress || 0,
          totalBudget: phaseStats.totalBudget || 0,
          completionRate: phaseStats.completionRate || 0,
      },
    };

    return stats;
    } catch (error) {
      console.error('[AdminDashboardController] GET /consultant/dashboard/stats - Error:', {
        userId: req.user.id,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  // 2. Recent activities
  @Get("recent-activities")
  async getRecentActivities(@Query("limit") limit: number = 10) {
    const activities = await this.activitiesService.getRecentActivities(limit);

    return activities;
  }

  // 3. Trends/analytics data for charts
  @Get("trends")
  async getTrends(
    @Query("metric") metric: string = "projects",
    @Query("period") period: string = "monthly",
    @Query("from") from?: string,
    @Query("to") to?: string
  ) {
    switch (metric) {
      case "projects":
        return this.projectsService.getTrends(period, from, to);
      case "users":
        return this.usersService.getTrends(period, from, to);
      case "activities":
        return this.activitiesService.getTrends(period, from, to);
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
    const projects = await this.projectsService.getTopActiveProjects(limit);

    return projects;
  }
}
