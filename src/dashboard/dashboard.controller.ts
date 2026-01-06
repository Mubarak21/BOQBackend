import { Controller, Get, UseGuards, Request, Query } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { DashboardService } from "./dashboard.service";
import { ProjectsService } from "../projects/projects.service";
import { RequestWithUser } from "../auth/interfaces/request-with-user.interface";

@Controller("dashboard")
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly projectsService: ProjectsService
  ) {}

  /**
   * Get user-specific dashboard statistics
   */
  @Get("stats")
  async getStats(@Request() req: RequestWithUser) {
    return this.dashboardService.getStats(req.user.id);
  }

  /**
   * Get user's projects (only projects they own or collaborate on)
   */
  @Get("my-projects")
  async getMyProjects(@Request() req: RequestWithUser) {
    const userProjects = await this.projectsService.findUserProjects(
      req.user.id
    );

    return Promise.all(
      userProjects.map((p) => this.projectsService.getProjectResponse(p))
    );
  }

  /**
   * Get recent projects activity for the user
   */
  @Get("recent-activity")
  async getRecentActivity(
    @Request() req: RequestWithUser,
    @Query("limit") limit: string = "10"
  ) {
    // This would integrate with ActivitiesService
    // For now, return user's projects with recent updates
    const userProjects = await this.projectsService.findUserProjects(
      req.user.id
    );

    const recentProjects = userProjects
      .sort((a, b) => b.updated_at.getTime() - a.updated_at.getTime())
      .slice(0, parseInt(limit));

    return Promise.all(
      recentProjects.map((p) => this.projectsService.getProjectResponse(p))
    );
  }

  /**
   * Get user's project statistics summary
   */
  @Get("summary")
  async getDashboardSummary(@Request() req: RequestWithUser) {
    const [stats, recentProjects] = await Promise.all([
      this.dashboardService.getUserStatsForDashboard(req.user.id),
      this.getMyProjects(req),
    ]);

    return {
      stats,
      recentProjects: recentProjects.slice(0, 5),
      totalProjects: recentProjects.length,
    };
  }
}
