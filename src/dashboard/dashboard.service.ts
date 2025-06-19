import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between } from "typeorm";
import { Project, ProjectStatus } from "../entities/project.entity";
import { User } from "../entities/user.entity";
import { Task, TaskStatus } from "../entities/task.entity";

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>
  ) {}

  async getStats(userId: string) {
    const [
      totalProjects,
      activeProjects,
      completedProjects,
      totalTeamMembers,
      phaseStats,
      monthlyGrowth,
      totalProjectValues,
    ] = await Promise.all([
      this.getTotalProjects(userId),
      this.getActiveProjects(userId),
      this.getCompletedProjects(userId),
      this.getTotalTeamMembers(userId),
      this.getPhaseStats(userId),
      this.getMonthlyGrowth(userId),
      this.getTotalProjectValues(userId),
    ]);

    return {
      total_projects: totalProjects,
      active_projects: activeProjects,
      completed_projects: completedProjects,
      total_team_members: totalTeamMembers,
      phase_statistics: phaseStats,
      monthly_growth: monthlyGrowth,
      total_project_values: totalProjectValues,
      completion_rate:
        totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0,
    };
  }

  private async getTotalProjects(userId: string): Promise<number> {
    return this.projectsRepository.count({
      where: [{ owner_id: userId }, { collaborators: { id: userId } }],
    });
  }

  private async getActiveProjects(userId: string): Promise<number> {
    return this.projectsRepository.count({
      where: [
        { owner_id: userId, status: ProjectStatus.IN_PROGRESS },
        { collaborators: { id: userId }, status: ProjectStatus.IN_PROGRESS },
      ],
    });
  }

  private async getCompletedProjects(userId: string): Promise<number> {
    return this.projectsRepository.count({
      where: [
        { owner_id: userId, status: ProjectStatus.COMPLETED },
        { collaborators: { id: userId }, status: ProjectStatus.COMPLETED },
      ],
    });
  }

  private async getTotalTeamMembers(userId: string): Promise<number> {
    const projects = await this.projectsRepository.find({
      where: [{ owner_id: userId }, { collaborators: { id: userId } }],
      relations: ["collaborators"],
    });

    const uniqueTeamMembers = new Set<string>();
    projects.forEach((project) => {
      project.collaborators.forEach((collaborator) => {
        uniqueTeamMembers.add(collaborator.id);
      });
      if (project.owner_id) {
        uniqueTeamMembers.add(project.owner_id);
      }
    });

    return uniqueTeamMembers.size;
  }

  private async getPhaseStats(userId: string): Promise<any> {
    const projects = await this.projectsRepository.find({
      where: [{ owner_id: userId }, { collaborators: { id: userId } }],
      relations: ["phases"],
    });

    const stats = {
      total_phases: 0,
      completed_phases: 0,
      in_progress_phases: 0,
      total_budget: 0,
      spent_budget: 0,
    };

    projects.forEach((project) => {
      const projectPhases = project.phases || [];
      stats.total_phases += projectPhases.length;
      stats.completed_phases += projectPhases.filter(
        (phase) => phase.status === TaskStatus.COMPLETED
      ).length;
      stats.in_progress_phases += projectPhases.filter(
        (phase) => phase.status === TaskStatus.IN_PROGRESS
      ).length;
      stats.total_budget += projectPhases.reduce(
        (sum, phase) => sum + (phase.budget || 0),
        0
      );
      stats.spent_budget += projectPhases.reduce(
        (sum, phase) => sum + (phase.spent || 0),
        0
      );
    });

    return stats;
  }

  private async getMonthlyGrowth(userId: string): Promise<number> {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [lastMonthProjects, thisMonthProjects] = await Promise.all([
      this.projectsRepository.count({
        where: [
          {
            owner_id: userId,
            created_at: Between(lastMonth, thisMonth),
          },
          {
            collaborators: { id: userId },
            created_at: Between(lastMonth, thisMonth),
          },
        ],
      }),
      this.projectsRepository.count({
        where: [
          {
            owner_id: userId,
            created_at: Between(thisMonth, now),
          },
          {
            collaborators: { id: userId },
            created_at: Between(thisMonth, now),
          },
        ],
      }),
    ]);

    if (lastMonthProjects === 0) return 100;
    return ((thisMonthProjects - lastMonthProjects) / lastMonthProjects) * 100;
  }

  private async getTotalProjectValues(userId: string): Promise<number> {
    const projects = await this.projectsRepository.find({
      where: [{ owner_id: userId }, { collaborators: { id: userId } }],
      select: ["total_amount"],
    });

    return projects.reduce(
      (sum, project) => sum + (project.total_amount || 0),
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
      (phase) => phase.status === TaskStatus.COMPLETED
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
    const spent = projectPhases.reduce((sum, phase) => sum + phase.spent, 0);

    return {
      totalBudget,
      spent,
      remaining: totalBudget - spent,
    };
  }
}
