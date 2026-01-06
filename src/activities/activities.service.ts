import { Injectable, Inject, forwardRef } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In, Between } from "typeorm";
import { Activity, ActivityType } from "../entities/activity.entity";
import { User } from "../entities/user.entity";
import { Project } from "../entities/project.entity";
import { Task } from "../entities/task.entity";
import { Phase } from "../entities/phase.entity";
import { ProjectsService } from "../projects/projects.service";

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(Activity)
    private activitiesRepository: Repository<Activity>,
    @Inject(forwardRef(() => ProjectsService))
    private readonly projectsService: ProjectsService
  ) {}

  async createActivity(
    type: ActivityType,
    description: string,
    user: User,
    project: Project,
    phaseOrTask: Phase | Task | null,
    metadata: any = {}
  ): Promise<Activity> {
    const activity = this.activitiesRepository.create({
      type,
      description,
      user_id: user.id,
      project_id: project.id,
      metadata: JSON.stringify(metadata),
    });
    return this.activitiesRepository.save(activity);
  }

  async getProjectActivities(
    projectId: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<Activity[]> {
    return this.activitiesRepository.find({
      where: { project_id: projectId },
      relations: ["user", "task"],
      order: { created_at: "DESC" },
      take: limit,
      skip: offset,
    });
  }

  async getUserActivities(
    userId: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<Activity[]> {
    return this.activitiesRepository.find({
      where: { user_id: userId },
      relations: ["project", "task"],
      order: { created_at: "DESC" },
      take: limit,
      skip: offset,
    });
  }

  async getRecentActivities(
    limit: number = 10,
    offset: number = 0
  ): Promise<Activity[]> {
    return this.activitiesRepository.find({
      relations: ["user", "project", "task"],
      order: { created_at: "DESC" },
      take: limit,
      skip: offset,
    });
  }

  async countAll(): Promise<number> {
    return this.activitiesRepository.count();
  }

  // BOQ and Phase related activities
  async logBoqUploaded(
    user: User,
    project: Project,
    filename: string,
    totalPhases: number,
    totalAmount: number
  ): Promise<Activity> {
    return this.createActivity(
      ActivityType.BOQ_UPLOADED,
      `BOQ file "${filename}" was uploaded with ${totalPhases} phases`,
      user,
      project,
      null,
      {
        filename,
        total_phases: totalPhases,
        total_amount: totalAmount,
      }
    );
  }

  async logPhaseCreated(
    user: User,
    project: Project,
    phase: Phase,
    phaseNumber: number,
    totalPhases: number
  ): Promise<Activity> {
    return this.createActivity(
      ActivityType.TASK_CREATED,
      `Phase ${phaseNumber}/${totalPhases}: "${phase.title}" was created`,
      user,
      project,
      phase,
      {
        phase_id: phase.id,
        phase_number: phaseNumber,
        total_phases: totalPhases,
        budget: phase.budget,
      }
    );
  }

  async logPhaseCompleted(
    user: User,
    project: Project,
    phase: Phase,
    phaseNumber: number,
    totalPhases: number
  ): Promise<Activity> {
    return this.createActivity(
      ActivityType.PHASE_COMPLETED,
      `Phase ${phaseNumber}/${totalPhases}: "${phase.title}" was completed`,
      user,
      project,
      phase,
      {
        phase_id: phase.id,
        phase_number: phaseNumber,
        total_phases: totalPhases,
      }
    );
  }

  async logPhaseProgress(
    user: User,
    project: Project,
    phase: Phase,
    phaseNumber: number,
    totalPhases: number,
    progress: number
  ): Promise<Activity> {
    return this.createActivity(
      ActivityType.TASK_UPDATED,
      `Phase ${phaseNumber}/${totalPhases}: "${phase.title}" progress updated to ${progress}%`,
      user,
      project,
      phase,
      {
        phase_id: phase.id,
        phase_number: phaseNumber,
        total_phases: totalPhases,
        progress,
        previous_progress: phase.progress,
      }
    );
  }

  async logPhaseDelay(
    user: User,
    project: Project,
    phase: Phase,
    phaseNumber: number,
    totalPhases: number,
    delayDays: number
  ): Promise<Activity> {
    return this.createActivity(
      ActivityType.TASK_UPDATED,
      `Phase ${phaseNumber}/${totalPhases}: "${phase.title}" is ${delayDays} days behind schedule`,
      user,
      project,
      phase,
      {
        phase_id: phase.id,
        phase_number: phaseNumber,
        total_phases: totalPhases,
        delay_days: delayDays,
        end_date: phase.end_date,
      }
    );
  }

  async logPhaseBudgetUpdate(
    user: User,
    project: Project,
    phase: Phase,
    phaseNumber: number,
    totalPhases: number,
    oldBudget: number,
    newBudget: number
  ): Promise<Activity> {
    return this.createActivity(
      ActivityType.TASK_UPDATED,
      `Phase ${phaseNumber}/${totalPhases}: "${phase.title}" budget updated from ${oldBudget} to ${newBudget}`,
      user,
      project,
      phase,
      {
        phase_id: phase.id,
        phase_number: phaseNumber,
        total_phases: totalPhases,
        old_budget: oldBudget,
        new_budget: newBudget,
      }
    );
  }

  async logPhaseDeleted(
    user: User,
    project: Project,
    phase: Phase,
    phaseNumber: number,
    totalPhases: number
  ): Promise<Activity> {
    return this.createActivity(
      ActivityType.TASK_DELETED,
      `Phase ${phaseNumber}/${totalPhases}: "${phase.title}" was deleted`,
      user,
      project,
      phase,
      {
        phase_id: phase.id,
        phase_number: phaseNumber,
        total_phases: totalPhases,
        budget: phase.budget,
      }
    );
  }

  // Other activity logging methods...
  async logProjectCreated(
    user: User,
    project: Project,
    task: Task
  ): Promise<Activity> {
    return this.createActivity(
      ActivityType.PROJECT_CREATED,
      `Project "${project.title}" was created`,
      user,
      project,
      task
    );
  }

  async logTaskCompleted(
    user: User,
    project: Project,
    task: Task
  ): Promise<Activity> {
    return this.createActivity(
      ActivityType.TASK_COMPLETED,
      `Task "${task.description}" was completed`,
      user,
      project,
      task
    );
  }

  async logCommentAdded(
    user: User,
    project: Project,
    task: Task
  ): Promise<Activity> {
    return this.createActivity(
      ActivityType.COMMENT_ADDED,
      `Comment added on "${task.description}"`,
      user,
      project,
      task
    );
  }

  async logCollaboratorAdded(
    user: User,
    project: Project,
    collaborator: User
  ): Promise<Activity> {
    return this.createActivity(
      ActivityType.COLLABORATOR_ADDED,
      `${collaborator.display_name} joined as a collaborator in ${project.title}`,
      user,
      project,
      null,
      { collaborator_id: collaborator.id }
    );
  }

  async getPhaseActivities(
    phaseId: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<Activity[]> {
    // phase_id is not a direct column, so filter by phase_id in metadata
    return this.activitiesRepository
      .createQueryBuilder("activity")
      .where(`activity.metadata::jsonb ->> 'phase_id' = :phaseId`, { phaseId })
      .orderBy("activity.created_at", "DESC")
      .take(limit)
      .skip(offset)
      .getMany();
  }

  async logJoinRequest(
    owner: User,
    project: Project,
    requester: User
  ): Promise<Activity> {
    return this.createActivity(
      ActivityType.COLLABORATOR_ADDED,
      `${requester.display_name} requested to join your project`,
      owner,
      project,
      null,
      { requester_id: requester.id }
    );
  }

  async getUserProjectActivities(
    userId: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<Activity[]> {
    // Get all projects and filter for those where user is owner or collaborator
    const projects = await this.projectsService.findAll();
    const userProjectIds = projects
      .filter(
        (p) =>
          p.owner_id === userId ||
          (p.collaborators && p.collaborators.some((c) => c.id === userId))
      )
      .map((p) => p.id);
    if (userProjectIds.length === 0) return [];
    return this.activitiesRepository.find({
      where: { project_id: In(userProjectIds) },
      relations: ["user", "project", "task"],
      order: { created_at: "DESC" },
      take: limit,
      skip: offset,
    });
  }

  async getTrends(period: string = "monthly", from?: string, to?: string) {
    let startDate: Date | undefined = undefined;
    let endDate: Date | undefined = undefined;
    if (from) startDate = new Date(from);
    if (to) endDate = new Date(to);
    let groupFormat: string;
    switch (period) {
      case "daily":
        groupFormat = "YYYY-MM-DD";
        break;
      case "weekly":
        groupFormat = "IYYY-IW";
        break;
      case "monthly":
      default:
        groupFormat = "YYYY-MM";
        break;
    }
    const qb = this.activitiesRepository
      .createQueryBuilder("activity")
      .select(`to_char(activity.created_at, '${groupFormat}')`, "period")
      .addSelect("COUNT(*)", "count");
    if (startDate)
      qb.andWhere("activity.created_at >= :startDate", { startDate });
    if (endDate) qb.andWhere("activity.created_at <= :endDate", { endDate });
    qb.groupBy("period").orderBy("period", "ASC");
    return qb.getRawMany();
  }

  async adminList({
    userId,
    type,
    dateFrom,
    dateTo,
    projectId,
    search = "",
    page = 1,
    limit = 10,
  }) {
    // Ensure page and limit are numbers
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    const qb = this.activitiesRepository
      .createQueryBuilder("activity")
      .leftJoinAndSelect("activity.user", "user")
      .leftJoinAndSelect("activity.project", "project");
    if (userId) {
      qb.andWhere("activity.user_id = :userId", { userId });
    }
    if (type) {
      qb.andWhere("activity.type = :type", { type });
    }
    if (dateFrom) {
      qb.andWhere("activity.created_at >= :dateFrom", { dateFrom });
    }
    if (dateTo) {
      qb.andWhere("activity.created_at <= :dateTo", { dateTo });
    }
    if (projectId) {
      qb.andWhere("activity.project_id = :projectId", { projectId });
    }
    if (search) {
      qb.andWhere("activity.description ILIKE :search", {
        search: `%${search}%`,
      });
    }
    qb.orderBy("activity.created_at", "DESC")
      .skip((pageNum - 1) * limitNum)
      .take(limitNum);
    const [items, total] = await qb.getManyAndCount();
    return {
      items: items.map((a) => ({
        id: a.id,
        type: a.type,
        description: a.description,
        user: a.user
          ? { id: a.user.id, name: a.user.display_name, email: a.user.email }
          : null,
        project: a.project ? { id: a.project.id, name: a.project.title } : null,
        timestamp: a.created_at,
        // add more fields as needed
      })),
      total,
      page: pageNum,
      limit: limitNum,
    };
  }

  async adminGetDetails(id: string) {
    const activity = await this.activitiesRepository.findOne({
      where: { id },
      relations: ["user", "project"],
    });
    if (!activity) throw new Error("Activity not found");
    return {
      id: activity.id,
      type: activity.type,
      description: activity.description,
      user: activity.user
        ? {
            id: activity.user.id,
            name: activity.user.display_name,
            email: activity.user.email,
          }
        : null,
      project: activity.project
        ? { id: activity.project.id, name: activity.project.title }
        : null,
      timestamp: activity.created_at,
      // add more fields as needed
    };
  }
}
