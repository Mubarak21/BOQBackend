import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ProjectsService } from "../../../projects/projects.service";
import { UsersService } from "../../../users/users.service";
import { ActivitiesService } from "../../../activities/activities.service";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { ProjectStatus } from "../../../entities/project.entity";
import { PhaseStatus } from "../../../entities/phase.entity";

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

  // Comprehensive stats endpoint for admin dashboard
  @Get("stats")
  async getStats() {
    console.log("🔍 Admin Dashboard - Fetching comprehensive stats...");
    
    // Get all projects with relations
    const projects = await this.projectsService.findAllForAdmin();
    
    // Calculate project statistics
    const totalProjects = projects.length;
    const activeProjects = projects.filter(
      (p) => p.status === ProjectStatus.IN_PROGRESS || p.status === ProjectStatus.PLANNING
    ).length;
    const completedProjects = projects.filter(
      (p) => p.status === ProjectStatus.COMPLETED
    ).length;

    // Calculate total value
    const totalValue = projects.reduce((sum, project) => {
      const budget = project.totalBudget != null ? Number(project.totalBudget) : null;
      const amount = project.totalAmount != null ? Number(project.totalAmount) : null;
      const value = (budget != null && !isNaN(budget)) ? budget : 
                    (amount != null && !isNaN(amount)) ? amount : 0;
      return sum + value;
    }, 0);

    // Calculate monthly growth
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const lastMonthProjects = projects.filter(
      (p) => p.created_at >= lastMonth && p.created_at < thisMonth
    ).length;
    const thisMonthProjects = projects.filter(
      (p) => p.created_at >= thisMonth && p.created_at <= now
    ).length;
    const monthlyGrowth = lastMonthProjects === 0 
      ? (thisMonthProjects > 0 ? 100 : 0)
      : ((thisMonthProjects - lastMonthProjects) / lastMonthProjects) * 100;

    // Calculate unique team members
    const uniqueTeamMembers = new Set<string>();
    projects.forEach((project) => {
      project.collaborators?.forEach((collaborator) => {
        uniqueTeamMembers.add(collaborator.id);
      });
      if (project.owner_id) {
        uniqueTeamMembers.add(project.owner_id);
      }
    });
    const teamMembers = uniqueTeamMembers.size;

    // Calculate phase statistics
    const phaseStats = {
      totalPhases: 0,
      completedPhases: 0,
      inProgressPhases: 0,
      totalBudget: 0,
    };

    projects.forEach((project) => {
      const projectPhases = project.phases || [];
      phaseStats.totalPhases += projectPhases.length;
      phaseStats.completedPhases += projectPhases.filter(
        (phase) => phase.status === PhaseStatus.COMPLETED
      ).length;
      phaseStats.inProgressPhases += projectPhases.filter(
        (phase) => phase.status === PhaseStatus.IN_PROGRESS
      ).length;
      phaseStats.totalBudget += projectPhases.reduce(
        (sum, phase) => sum + (Number(phase.budget) || 0),
        0
      );
    });

    const stats = {
      totalProjects,
      activeProjects,
      completedProjects,
      totalValue,
      monthlyGrowth: Math.round(monthlyGrowth * 100) / 100, // Round to 2 decimal places
      teamMembers,
      phaseStats,
    };

    console.log("📊 Admin Dashboard Stats:", stats);
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
