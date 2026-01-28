import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Project } from "../../entities/project.entity";
import { Phase } from "../../entities/phase.entity";

@Injectable()
export class ProjectDashboardService {
  constructor(
    @InjectRepository(Project)
    private readonly projectsRepository: Repository<Project>,
    @InjectRepository(Phase)
    private readonly phasesRepository: Repository<Phase>
  ) {}

  /**
   * Get aggregated project statistics for dashboard
   * Uses financialSummary for accurate budget values
   * Counts ALL projects regardless of status
   */
  async getDashboardProjectStats() {
    try {
      // First, get a simple count of all projects to ensure we're counting correctly
      const totalCount = await this.projectsRepository.count();
      
      const result = await this.projectsRepository
        .createQueryBuilder("project")
        .leftJoin("project.financialSummary", "financialSummary")
        .select("COUNT(project.id)", "total")
        .addSelect(
          `SUM(CASE WHEN project.status IN ('in_progress', 'planning') THEN 1 ELSE 0 END)`,
          "active"
        )
        .addSelect(
          `SUM(CASE WHEN project.status = 'completed' THEN 1 ELSE 0 END)`,
          "completed"
        )
        // Use correct column name for totalAmount (camelCase) as defined in Project entity
        .addSelect(
          `SUM(COALESCE(financialSummary.total_budget, project."totalAmount", 0))`,
          "totalValue"
        )
        .getRawOne();

      // Parse results more robustly - handle both string and number results
      const total = result?.total 
        ? (typeof result.total === 'string' ? parseInt(result.total, 10) : Math.floor(Number(result.total)))
        : totalCount; // Fallback to count() if query result is invalid
      
      const active = result?.active 
        ? (typeof result.active === 'string' ? parseInt(result.active, 10) : Math.floor(Number(result.active)))
        : 0;
      
      const completed = result?.completed 
        ? (typeof result.completed === 'string' ? parseInt(result.completed, 10) : Math.floor(Number(result.completed)))
        : 0;
      
      const totalValue = result?.totalValue 
        ? (typeof result.totalValue === 'string' ? parseFloat(result.totalValue) : Number(result.totalValue))
        : 0;

      return {
        total: total || 0,
        active: active || 0,
        completed: completed || 0,
        totalValue: totalValue || 0,
      };
    } catch (error) {
      console.error('[ProjectDashboardService] Error getting project stats:', error);
      // Fallback: use simple count
      try {
        const totalCount = await this.projectsRepository.count();
        return {
          total: totalCount || 0,
          active: 0,
          completed: 0,
          totalValue: 0,
        };
      } catch (fallbackError) {
        console.error('[ProjectDashboardService] Fallback count also failed:', fallbackError);
        return {
          total: 0,
          active: 0,
          completed: 0,
          totalValue: 0,
        };
      }
    }
  }

  /**
   * Get aggregated phase statistics for dashboard
   * Only includes active phases
   */
  async getDashboardPhaseStats() {
    try {
      const result = await this.phasesRepository
        .createQueryBuilder("phase")
        .select("COUNT(phase.id)", "total")
        .addSelect(
          `SUM(CASE WHEN phase.status = 'completed' THEN 1 ELSE 0 END)`,
          "completed"
        )
        .addSelect(
          `SUM(CASE WHEN phase.status = 'in_progress' THEN 1 ELSE 0 END)`,
          "inProgress"
        )
        .addSelect("SUM(COALESCE(phase.budget, 0))", "totalBudget")
        .where("phase.is_active = :isActive", { isActive: true })
        .getRawOne();

      const total = parseInt(result?.total) || 0;
      const completed = parseInt(result?.completed) || 0;
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        total,
        completed,
        inProgress: parseInt(result?.inProgress) || 0,
        totalBudget: parseFloat(result?.totalBudget) || 0,
        completionRate,
      };
    } catch (error) {
      console.error('[ProjectDashboardService] Error getting phase stats:', error);
      return {
        total: 0,
        completed: 0,
        inProgress: 0,
        totalBudget: 0,
        completionRate: 0,
      };
    }
  }

  /**
   * Get unique team members count (owners + collaborators)
   */
  async getDashboardTeamMembersCount() {
    try {
      const result = await this.projectsRepository.query(`
        SELECT COUNT(DISTINCT user_id) as count
        FROM (
          SELECT DISTINCT owner_id::text as user_id
          FROM project
          WHERE owner_id IS NOT NULL
          UNION
          SELECT DISTINCT user_id::text
          FROM project_collaborators
          WHERE user_id IS NOT NULL
        ) AS unique_users
      `);

      return parseInt(result[0]?.count) || 0;
    } catch (error) {

      // Fallback: simple count using query builder
      try {
        const ownerCount = await this.projectsRepository
          .createQueryBuilder("project")
          .select("COUNT(DISTINCT project.owner_id)", "count")
          .where("project.owner_id IS NOT NULL")
          .getRawOne();
        return parseInt(ownerCount?.count) || 0;
      } catch {
        return 0;
      }
    }
  }

  /**
   * Get monthly project growth percentage
   */
  async getDashboardMonthlyGrowth() {
    try {
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      const [lastMonthResult, thisMonthResult] = await Promise.all([
        this.projectsRepository
          .createQueryBuilder("project")
          .select("COUNT(project.id)", "count")
          .where("project.created_at >= :lastMonth", { lastMonth })
          .andWhere("project.created_at < :thisMonth", { thisMonth })
          .getRawOne(),
        this.projectsRepository
          .createQueryBuilder("project")
          .select("COUNT(project.id)", "count")
          .where("project.created_at >= :thisMonth", { thisMonth })
          .andWhere("project.created_at < :nextMonth", { nextMonth })
          .getRawOne(),
      ]);

      const lastMonthProjects = parseInt(lastMonthResult?.count) || 0;
      const thisMonthProjects = parseInt(thisMonthResult?.count) || 0;

      const monthlyGrowth =
        lastMonthProjects === 0
          ? thisMonthProjects > 0
            ? 100
            : 0
          : ((thisMonthProjects - lastMonthProjects) / lastMonthProjects) * 100;

      return Math.round(monthlyGrowth * 100) / 100;
    } catch (error) {

      return 0;
    }
  }
}

