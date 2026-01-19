import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between } from "typeorm";
import { Project, ProjectStatus } from "../entities/project.entity";
import { User, UserRole } from "../entities/user.entity";
import { Task } from "../entities/task.entity";
import { Phase } from "../entities/phase.entity";
import { Stats } from "../entities/stats.entity";

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    @InjectRepository(Stats)
    private readonly statsRepository: Repository<Stats>
  ) {}

  async getStats(userId: string, userRole?: string) {
    // Contractors and sub-contractors can see all projects
    const isContractor = userRole?.toLowerCase() === UserRole.CONTRACTOR.toLowerCase();
    const isSubContractor = userRole?.toLowerCase() === UserRole.SUB_CONTRACTOR.toLowerCase();
    const canSeeAllProjects = isContractor || isSubContractor;

    const [
      totalProjects,
      activeProjects,
      completedProjects,
      totalTeamMembers,
      phaseStats,
      monthlyGrowth,
      totalProjectValues,
      taskStats,
      averagePhaseProgress,
    ] = await Promise.all([
      this.getTotalProjects(userId, canSeeAllProjects),
      this.getActiveProjects(userId, canSeeAllProjects),
      this.getCompletedProjects(userId, canSeeAllProjects),
      this.getTotalTeamMembers(userId, canSeeAllProjects),
      this.getPhaseStats(userId, canSeeAllProjects),
      this.getMonthlyGrowth(userId, canSeeAllProjects),
      this.getTotalProjectValues(userId, canSeeAllProjects),
      this.getTaskStats(userId, canSeeAllProjects),
      this.getAveragePhaseProgress(userId, canSeeAllProjects),
    ]);

    return {
      totalProjects: totalProjects,
      activeProjects: activeProjects,
      completedProjects: completedProjects,
      totalValue: totalProjectValues,
      monthlyGrowth: monthlyGrowth,
      teamMembers: totalTeamMembers,
      phaseStats: {
        totalPhases: phaseStats.total_phases,
        completedPhases: phaseStats.completed_phases,
        inProgressPhases: phaseStats.in_progress_phases,
        totalBudget: phaseStats.total_budget,
      },
      completion_rate:
        totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0,
      total_tasks: taskStats.total_tasks,
      tasks_per_phase: taskStats.tasks_per_phase,
      average_phase_progress: averagePhaseProgress,
    };
  }

  async updateStats() {

    // Get all projects in the database
    const allProjects = await this.projectsRepository.find();
    const totalProjects = allProjects.length;

    const projects = await this.projectsRepository.find({
      relations: ["collaborators", "owner", "phases"],
    });
    const totalValue = projects
      .reduce(
        (sum: number, project: any) =>
          sum + Number(project.totalBudget ?? project.totalAmount ?? 0),
        0
      )
      .toFixed(2);

    const uniqueTeamMembers = new Set<string>();
    projects.forEach((project) => {
      project.collaborators?.forEach((collaborator) =>
        uniqueTeamMembers.add(collaborator.id)
      );
      if (project.owner_id) uniqueTeamMembers.add(project.owner_id);
    });
    const teamMembers = uniqueTeamMembers.size;

    // Upsert the stats row (assume only one row)
    let stats = await this.statsRepository.findOneBy({});
    if (!stats) {
      stats = this.statsRepository.create();

    } else {

    }
    stats.total_projects = totalProjects;
    stats.total_value = totalValue;
    stats.team_members = teamMembers;
    await this.statsRepository.save(stats);

    return stats;
  }

  async getStatsFromTable() {
    let stats = await this.statsRepository.findOneBy({});
    if (!stats) {
      return {
        total_projects: 0,
        total_value: "0.00",
        team_members: 0,
        updated_at: null,
      };
    }
    return stats;
  }

  /**
   * Get user-specific dashboard stats in the format expected by frontend
   * Contractors and sub-contractors see stats for ALL projects
   */
  async getUserStatsForDashboard(userId: string, userRole?: string) {
    const isContractor = userRole?.toLowerCase() === UserRole.CONTRACTOR.toLowerCase();
    const isSubContractor = userRole?.toLowerCase() === UserRole.SUB_CONTRACTOR.toLowerCase();
    const canSeeAllProjects = isContractor || isSubContractor;

    const [totalProjects, completedProjects, totalTeamMembers, totalValue] =
      await Promise.all([
        this.getTotalProjects(userId, canSeeAllProjects),
        this.getCompletedProjects(userId, canSeeAllProjects),
        this.getTotalTeamMembers(userId, canSeeAllProjects),
        this.getTotalProjectValues(userId, canSeeAllProjects),
      ]);

    const completion_rate =
      totalProjects > 0
        ? ((completedProjects / totalProjects) * 100).toFixed(2)
        : "0.00";

    return {
      total_projects: totalProjects,
      //total_value: totalValue.toFixed(2),
      team_members: totalTeamMembers,
      completion_rate: completion_rate,
      updated_at: new Date().toISOString(),
    };
  }

  private async getTotalProjects(userId: string, canSeeAllProjects: boolean = false): Promise<number> {

    if (canSeeAllProjects) {
      const count = await this.projectsRepository.count();
      return count;
    }
    const count = await this.projectsRepository.count({
      where: [{ owner_id: userId }, { collaborators: { id: userId } }],
    });

    return count;
  }

  private async getActiveProjects(userId: string, canSeeAllProjects: boolean = false): Promise<number> {
    if (canSeeAllProjects) {
      return this.projectsRepository.count({
        where: { status: ProjectStatus.IN_PROGRESS },
      });
    }
    return this.projectsRepository.count({
      where: [
        { owner_id: userId, status: ProjectStatus.IN_PROGRESS },
        { collaborators: { id: userId }, status: ProjectStatus.IN_PROGRESS },
      ],
    });
  }

  private async getCompletedProjects(userId: string, canSeeAllProjects: boolean = false): Promise<number> {
    if (canSeeAllProjects) {
      return this.projectsRepository.count({
        where: { status: ProjectStatus.COMPLETED },
      });
    }
    return this.projectsRepository.count({
      where: [
        { owner_id: userId, status: ProjectStatus.COMPLETED },
        { collaborators: { id: userId }, status: ProjectStatus.COMPLETED },
      ],
    });
  }

  private async getTotalTeamMembers(userId: string, canSeeAllProjects: boolean = false): Promise<number> {
    const projects = canSeeAllProjects
      ? await this.projectsRepository.find({
          relations: ["collaborators"],
        })
      : await this.projectsRepository.find({
          where: [{ owner_id: userId }, { collaborators: { id: userId } }],
          relations: ["collaborators"],
        });

    const uniqueTeamMembers = new Set<string>();
    projects.forEach((project) => {
      project.collaborators?.forEach((collaborator) => {
        uniqueTeamMembers.add(collaborator.id);
      });
      if (project.owner_id) {
        uniqueTeamMembers.add(project.owner_id);
      }
    });

    return uniqueTeamMembers.size;
  }

  private async getPhaseStats(userId: string, canSeeAllProjects: boolean = false): Promise<any> {
    const projects = canSeeAllProjects
      ? await this.projectsRepository.find({
          relations: ["phases"],
        })
      : await this.projectsRepository.find({
          where: [{ owner_id: userId }, { collaborators: { id: userId } }],
          relations: ["phases"],
        });

    const stats = {
      total_phases: 0,
      completed_phases: 0,
      in_progress_phases: 0,
      total_budget: 0,
    };

    projects.forEach((project) => {
      const projectPhases: Phase[] = project.phases || [];
      stats.total_phases += projectPhases.length;
      stats.completed_phases += projectPhases.filter(
        (phase) => phase.status === "completed"
      ).length;
      stats.in_progress_phases += projectPhases.filter(
        (phase) => phase.status === "in_progress"
      ).length;
      stats.total_budget += projectPhases.reduce(
        (sum, phase) => sum + (phase.budget || 0),
        0
      );
    });

    return stats;
  }

  private async getMonthlyGrowth(userId: string, canSeeAllProjects: boolean = false): Promise<number> {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const whereCondition = canSeeAllProjects
      ? { created_at: Between(lastMonth, thisMonth) }
      : [
          {
            owner_id: userId,
            created_at: Between(lastMonth, thisMonth),
          },
          {
            collaborators: { id: userId },
            created_at: Between(lastMonth, thisMonth),
          },
        ];

    const whereConditionThisMonth = canSeeAllProjects
      ? { created_at: Between(thisMonth, now) }
      : [
          {
            owner_id: userId,
            created_at: Between(thisMonth, now),
          },
          {
            collaborators: { id: userId },
            created_at: Between(thisMonth, now),
          },
        ];

    const [lastMonthProjects, thisMonthProjects] = await Promise.all([
      this.projectsRepository.count({
        where: whereCondition,
      }),
      this.projectsRepository.count({
        where: whereConditionThisMonth,
      }),
    ]);

    if (lastMonthProjects === 0) return 100;
    return ((thisMonthProjects - lastMonthProjects) / lastMonthProjects) * 100;
  }

  private async getTotalProjectValues(userId: string, canSeeAllProjects: boolean = false): Promise<number> {
    const projects = canSeeAllProjects
      ? await this.projectsRepository.find({
          select: ["totalBudget", "totalAmount"],
        })
      : await this.projectsRepository.find({
          where: [{ owner_id: userId }, { collaborators: { id: userId } }],
          select: ["totalBudget", "totalAmount"],
        });

    return projects.reduce(
      (sum, project) => {
        const budget = project.totalBudget != null ? Number(project.totalBudget) : null;
        const amount = project.totalAmount != null ? Number(project.totalAmount) : null;
        const value = (budget != null && !isNaN(budget)) ? budget : 
                      (amount != null && !isNaN(amount)) ? amount : 0;
        return sum + value;
      },
      0
    );
  }

  async getProjectProgress(project: Project): Promise<{
    totalPhases: number;
    completedPhases: number;
    progress: number;
  }> {
    const projectPhases = project.phases || [];
    const totalPhases = projectPhases.length;
    const completedPhases = projectPhases.filter(
      (phase) => phase.status === "completed"
    ).length;

    return {
      totalPhases,
      completedPhases,
      progress: totalPhases > 0 ? (completedPhases / totalPhases) * 100 : 0,
    };
  }

  async getProjectBudget(project: Project): Promise<{
    totalBudget: number;
    spent: number;
    remaining: number;
  }> {
    const projectPhases = project.phases || [];
    const totalBudget = projectPhases.reduce(
      (sum, phase) => sum + phase.budget,
      0
    );

    return {
      totalBudget,
      spent: 0, // Placeholder, as 'spent' is removed from Phase
      remaining: totalBudget,
    };
  }

  private async getTaskStats(userId: string, canSeeAllProjects: boolean = false) {
    // Get all projects and their phases/tasks
    const projects = canSeeAllProjects
      ? await this.projectsRepository.find({
          relations: ["phases", "phases.tasks"],
        })
      : await this.projectsRepository.find({
          where: [{ owner_id: userId }, { collaborators: { id: userId } }],
          relations: ["phases", "phases.tasks"],
        });
    let totalTasks = 0;
    let totalPhases = 0;
    projects.forEach((project) => {
      (project.phases || []).forEach((phase) => {
        totalPhases++;
        const tasks = phase.tasks || [];
        totalTasks += tasks.length;
      });
    });
    return {
      total_tasks: totalTasks,
      tasks_per_phase: totalPhases > 0 ? totalTasks / totalPhases : 0,
    };
  }

  private async getAveragePhaseProgress(userId: string, canSeeAllProjects: boolean = false) {
    const projects = canSeeAllProjects
      ? await this.projectsRepository.find({
          relations: ["phases"],
        })
      : await this.projectsRepository.find({
          where: [{ owner_id: userId }, { collaborators: { id: userId } }],
          relations: ["phases"],
        });
    let totalProgress = 0;
    let count = 0;
    projects.forEach((project) => {
      (project.phases || []).forEach((phase) => {
        if (typeof phase.progress === "number") {
          totalProgress += phase.progress;
          count++;
        }
      });
    });
    return count > 0 ? totalProgress / count : 0;
  }
}
