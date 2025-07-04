import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between } from "typeorm";
import { Project, ProjectStatus } from "../entities/project.entity";
import { User } from "../entities/user.entity";
import { Task } from "../entities/task.entity";
import { Phase } from "../entities/phase.entity";

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
      taskStats,
      phasePriorityBreakdown,
      averagePhaseProgress,
    ] = await Promise.all([
      this.getTotalProjects(userId),
      this.getActiveProjects(userId),
      this.getCompletedProjects(userId),
      this.getTotalTeamMembers(userId),
      this.getPhaseStats(userId),
      this.getMonthlyGrowth(userId),
      this.getTotalProjectValues(userId),
      this.getTaskStats(userId),
      this.getPhasePriorityBreakdown(userId),
      this.getAveragePhaseProgress(userId),
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
      phase_priority_breakdown: phasePriorityBreakdown,
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

  private async getTaskStats(userId: string) {
    // Get all projects and their phases/tasks
    const projects = await this.projectsRepository.find({
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

  private async getPhasePriorityBreakdown(userId: string) {
    const projects = await this.projectsRepository.find({
      where: [{ owner_id: userId }, { collaborators: { id: userId } }],
      relations: ["phases"],
    });
    const breakdown = { low: 0, medium: 0, high: 0, urgent: 0, none: 0 };
    projects.forEach((project) => {
      (project.phases || []).forEach((phase) => {
        const p = (phase.priority || "none").toLowerCase();
        if (breakdown[p] !== undefined) breakdown[p]++;
        else breakdown.none++;
      });
    });
    return breakdown;
  }

  private async getAveragePhaseProgress(userId: string) {
    const projects = await this.projectsRepository.find({
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
