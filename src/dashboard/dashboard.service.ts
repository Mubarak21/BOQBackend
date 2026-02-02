import { Injectable, Inject, forwardRef } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between, In } from "typeorm";
import { Project, ProjectStatus } from "../entities/project.entity";
import { User, UserRole } from "../entities/user.entity";
import { Task } from "../entities/task.entity";
import { Phase, PhaseStatus } from "../entities/phase.entity";
import { Stats } from "../entities/stats.entity";
import { Comment } from "../entities/comment.entity";
import { Penalty } from "../entities/penalty.entity";
import { Complaint } from "../entities/complaint.entity";
import { Accident } from "../entities/accident.entity";
import { DailyAttendance } from "../entities/daily-attendance.entity";
import { PhaseEvidence } from "../entities/phase-evidence.entity";
import { ProjectsService } from "../projects/projects.service";

export interface DashboardNotification {
  id: string;
  type: "feedback" | "penalty" | "complaint" | "accident" | "attendance" | "evidence";
  title: string;
  message: string;
  projectId: string;
  projectName: string;
  createdAt: string;
}

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
    private readonly statsRepository: Repository<Stats>,
    @InjectRepository(Comment)
    private readonly commentsRepository: Repository<Comment>,
    @InjectRepository(Penalty)
    private readonly penaltiesRepository: Repository<Penalty>,
    @InjectRepository(Complaint)
    private readonly complaintsRepository: Repository<Complaint>,
    @InjectRepository(Accident)
    private readonly accidentsRepository: Repository<Accident>,
    @InjectRepository(DailyAttendance)
    private readonly dailyAttendanceRepository: Repository<DailyAttendance>,
    @InjectRepository(PhaseEvidence)
    private readonly phaseEvidenceRepository: Repository<PhaseEvidence>,
    @Inject(forwardRef(() => ProjectsService))
    private readonly projectsService: ProjectsService
  ) {}

  async getStats(userId: string, userRole?: string) {
    // Consultants can see all projects (they create projects)
    // Contractors and sub-contractors can only see projects they're invited to
    const isConsultant = userRole?.toLowerCase() === UserRole.CONSULTANT.toLowerCase();
    const isContractor = userRole?.toLowerCase() === UserRole.CONTRACTOR.toLowerCase();
    const isSubContractor = userRole?.toLowerCase() === UserRole.SUB_CONTRACTOR.toLowerCase();
    const canSeeAllProjects = isConsultant; // Only consultants can see all projects

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
        completionRate: phaseStats.completion_rate || 0,
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
   * Consultants see stats for ALL projects (they create projects)
   * Contractors and sub-contractors see stats only for projects they're invited to
   */
  async getUserStatsForDashboard(userId: string, userRole?: string) {
    const isConsultant = userRole?.toLowerCase() === UserRole.CONSULTANT.toLowerCase();
    const isContractor = userRole?.toLowerCase() === UserRole.CONTRACTOR.toLowerCase();
    const isSubContractor = userRole?.toLowerCase() === UserRole.SUB_CONTRACTOR.toLowerCase();
    const canSeeAllProjects = isConsultant; // Only consultants can see all projects

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
    // Get projects first based on access
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
      const projectPhases: Phase[] = (project.phases || []).filter(
        (phase) => phase.is_active !== false // Only count active phases
      );
      stats.total_phases += projectPhases.length;
      stats.completed_phases += projectPhases.filter(
        (phase) => phase.status === PhaseStatus.COMPLETED
      ).length;
      stats.in_progress_phases += projectPhases.filter(
        (phase) => phase.status === PhaseStatus.IN_PROGRESS
      ).length;
      stats.total_budget += projectPhases.reduce(
        (sum, phase) => sum + (Number(phase.budget) || 0),
        0
      );
    });

    // Calculate completion rate
    const completionRate = stats.total_phases > 0 
      ? Math.round((stats.completed_phases / stats.total_phases) * 100) 
      : 0;

    return {
      ...stats,
      completion_rate: completionRate,
    };
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
          select: ["totalAmount"],
          relations: ["financialSummary"],
        })
      : await this.projectsRepository.find({
          where: [{ owner_id: userId }, { collaborators: { id: userId } }],
          select: ["totalAmount"],
          relations: ["financialSummary"],
        });

    return projects.reduce(
      (sum, project) => {
        const budget = project.financialSummary?.totalBudget != null ? Number(project.financialSummary.totalBudget) : null;
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

  /**
   * Get notifications for the current user. For all: consultant feedback, penalties.
   * For consultants only: complaints, accidents, attendance, and evidence reported by contractors/sub-contractors.
   */
  async getNotifications(
    userId: string,
    limit: number = 20,
    userRole?: string
  ): Promise<DashboardNotification[]> {
    const userProjects = await this.projectsService.findUserProjects(userId);
    const projectIds = userProjects.map((p) => p.id);
    if (projectIds.length === 0) return [];

    const projectMap = new Map(userProjects.map((p) => [p.id, p.title]));
    const consultantRole = UserRole.CONSULTANT.toLowerCase();
    const contractorRole = UserRole.CONTRACTOR.toLowerCase();
    const subContractorRole = UserRole.SUB_CONTRACTOR.toLowerCase();
    const isConsultant = userRole?.toLowerCase() === consultantRole;
    const items: DashboardNotification[] = [];

    const [comments, penalties] = await Promise.all([
      this.commentsRepository.find({
        where: { project_id: In(projectIds) },
        relations: ["author", "project"],
        order: { created_at: "DESC" },
        take: limit,
      }),
      this.penaltiesRepository.find({
        where: { project_id: In(projectIds) },
        relations: ["project"],
        order: { created_at: "DESC" },
        take: limit,
      }),
    ]);

    for (const c of comments) {
      const authorRole = (c.author as User)?.role?.toLowerCase();
      if (authorRole === consultantRole) {
        const projectName = (c.project as Project)?.title ?? projectMap.get(c.project_id) ?? "Project";
        items.push({
          id: `feedback-${c.id}`,
          type: "feedback",
          title: "Consultant feedback",
          message: c.content.length > 80 ? c.content.slice(0, 80) + "…" : c.content,
          projectId: c.project_id,
          projectName,
          createdAt: c.created_at.toISOString(),
        });
      }
    }

    for (const p of penalties) {
      const projectName = (p.project as Project)?.title ?? projectMap.get(p.project_id) ?? "Project";
      items.push({
        id: `penalty-${p.id}`,
        type: "penalty",
        title: "Penalty assigned",
        message: p.reason.length > 80 ? p.reason.slice(0, 80) + "…" : p.reason,
        projectId: p.project_id,
        projectName,
        createdAt: p.created_at.toISOString(),
      });
    }

    if (isConsultant && projectIds.length > 0) {
      const [complaints, accidents, attendances, evidences] = await Promise.all([
        this.complaintsRepository.find({
          where: { project_id: In(projectIds) },
          relations: ["raiser", "project"],
          order: { created_at: "DESC" },
          take: limit,
        }),
        this.accidentsRepository.find({
          where: { project_id: In(projectIds) },
          relations: ["reportedByUser", "project"],
          order: { created_at: "DESC" },
          take: limit,
        }),
        this.dailyAttendanceRepository.find({
          where: { project_id: In(projectIds) },
          relations: ["recordedByUser", "project"],
          order: { created_at: "DESC" },
          take: limit,
        }),
        this.phaseEvidenceRepository
          .createQueryBuilder("ev")
          .innerJoinAndSelect("ev.phase", "phase")
          .innerJoinAndSelect("ev.uploader", "uploader")
          .where("phase.project_id IN (:...projectIds)", { projectIds })
          .orderBy("ev.created_at", "DESC")
          .take(limit)
          .getMany(),
      ]);

      for (const c of complaints) {
        const raiserRole = (c.raiser as User)?.role?.toLowerCase();
        if (raiserRole === contractorRole || raiserRole === subContractorRole) {
          const projectName = (c.project as Project)?.title ?? projectMap.get(c.project_id) ?? "Project";
          items.push({
            id: `complaint-${c.id}`,
            type: "complaint",
            title: "New complaint",
            message: (() => {
              const raw = c.title || c.description || "Complaint raised";
              return raw.slice(0, 80) + (raw.length > 80 ? "…" : "");
            })(),
            projectId: c.project_id,
            projectName,
            createdAt: c.created_at.toISOString(),
          });
        }
      }

      for (const a of accidents) {
        const reporterRole = (a.reportedByUser as User)?.role?.toLowerCase();
        if (reporterRole === contractorRole || reporterRole === subContractorRole) {
          const projectName = (a.project as Project)?.title ?? projectMap.get(a.project_id) ?? "Project";
          items.push({
            id: `accident-${a.id}`,
            type: "accident",
            title: "Site accident reported",
            message: a.description?.slice(0, 80) + (a.description && a.description.length > 80 ? "…" : "") || "Accident on site",
            projectId: a.project_id,
            projectName,
            createdAt: a.created_at.toISOString(),
          });
        }
      }

      for (const att of attendances) {
        const recorderRole = (att.recordedByUser as User)?.role?.toLowerCase();
        if (recorderRole === contractorRole || recorderRole === subContractorRole) {
          const projectName = projectMap.get(att.project_id) ?? "Project";
          items.push({
            id: `attendance-${att.id}`,
            type: "attendance",
            title: "Daily attendance recorded",
            message: `${att.workers_present} workers on ${att.attendance_date}`,
            projectId: att.project_id,
            projectName,
            createdAt: att.created_at.toISOString(),
          });
        }
      }

      for (const ev of evidences) {
        const uploaderRole = (ev.uploader as User)?.role?.toLowerCase();
        if (uploaderRole === contractorRole || uploaderRole === subContractorRole) {
          const phase = ev.phase as { project_id?: string };
          const projectId = phase?.project_id;
          if (!projectId || !projectIds.includes(projectId)) continue;
          const projectName = projectMap.get(projectId) ?? "Project";
          items.push({
            id: `evidence-${ev.id}`,
            type: "evidence",
            title: "Evidence uploaded",
            message: (ev.notes || `${ev.type} evidence`).slice(0, 80),
            projectId,
            projectName,
            createdAt: ev.created_at.toISOString(),
          });
        }
      }
    }

    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return items.slice(0, limit);
  }
}
