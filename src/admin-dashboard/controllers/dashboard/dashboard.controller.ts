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
    console.log("🔍 Admin Dashboard - Fetching metrics...");
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

    console.log("📊 Admin Dashboard Metrics:", metrics);
    return metrics;
  }

  // Comprehensive stats endpoint for consultant dashboard - Optimized with database aggregations
  @Get("stats")
  async getStats(@Request() req: RequestWithUser) {
    console.log("🔍 Consultant Dashboard - Fetching comprehensive stats...");
    const startTime = Date.now();
    
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
        totalPhases: phaseStats.total,
        completedPhases: phaseStats.completed,
        inProgressPhases: phaseStats.inProgress,
        totalBudget: phaseStats.totalBudget,
        completionRate: phaseStats.completionRate,
      },
    };

    const duration = Date.now() - startTime;
    console.log(`📊 Consultant Dashboard Stats (${duration}ms):`, stats);
    return stats;
  }

  // 2. Recent activities
  @Get("recent-activities")
  async getRecentActivities(@Query("limit") limit: number = 10) {
    console.log(
      "🔍 Admin Dashboard - Fetching recent activities (limit:",
      limit,
      ")"
    );
    const activities = await this.activitiesService.getRecentActivities(limit);
    console.log("📊 Admin Dashboard Recent Activities:", activities);
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
    console.log(
      "🔍 Admin Dashboard - Fetching top projects (limit:",
      limit,
      ")"
    );
    const projects = await this.projectsService.getTopActiveProjects(limit);
    console.log("📊 Admin Dashboard Top Projects:", projects);
    return projects;
  }
}
