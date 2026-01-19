import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  forwardRef,
  Inject,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Phase, PhaseStatus } from "../../entities/phase.entity";
import { Project } from "../../entities/project.entity";
import { Task } from "../../entities/task.entity";
import { User } from "../../entities/user.entity";
import { CreatePhaseDto } from "../dto/create-phase.dto";
import { UpdatePhaseDto } from "../dto/update-phase.dto";
import { UsersService } from "../../users/users.service";
import { ActivitiesService } from "../../activities/activities.service";
import { ActivityType } from "../../entities/activity.entity";
import { ProjectsService } from "../projects.service";

@Injectable()
export class ProjectPhaseService {
  constructor(
    @InjectRepository(Phase)
    private readonly phasesRepository: Repository<Phase>,
    @InjectRepository(Project)
    private readonly projectsRepository: Repository<Project>,
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => ActivitiesService))
    private readonly activitiesService: ActivitiesService,
    @Inject(forwardRef(() => ProjectsService))
    private readonly projectsService: ProjectsService
  ) {}

  async createPhase(
    projectId: string,
    createPhaseDto: CreatePhaseDto,
    userId: string
  ): Promise<Phase> {
    if (!projectId || projectId.trim() === "") {
      throw new BadRequestException(
        "Project ID is required when creating a phase"
      );
    }

    const project = await this.projectsService.findOne(projectId, userId);

    if (!project || !project.id) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    const existingPhase = await this.phasesRepository.findOne({
      where: { project_id: projectId, title: createPhaseDto.title },
    });
    if (existingPhase) {
      throw new BadRequestException(
        "A phase with this title already exists for this project."
      );
    }

    let status = createPhaseDto.status;
    if (createPhaseDto.startDate) {
      const startDate = new Date(createPhaseDto.startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (
        (!status || status === PhaseStatus.NOT_STARTED) &&
        startDate <= today
      ) {
        status = PhaseStatus.IN_PROGRESS;
      }
    }

    if (!projectId || projectId.trim() === "") {
      throw new BadRequestException(
        "Project ID is required when creating a phase"
      );
    }

    const phaseData = {
      title: createPhaseDto.title,
      description: createPhaseDto.description,
      deliverables: createPhaseDto.deliverables,
      requirements: createPhaseDto.requirements,
      start_date: createPhaseDto.startDate,
      end_date: createPhaseDto.endDate,
      due_date: createPhaseDto.dueDate,
      budget: createPhaseDto.budget,
      progress: createPhaseDto.progress,
      status,
      parent_phase_id: createPhaseDto.parentPhaseId || null,
      reference_task_id: createPhaseDto.referenceTaskId || null,
      project_id: projectId,
      subPhases: createPhaseDto.subPhases ?? [],
    };

    const phase = this.phasesRepository.create({
      ...phaseData,
      project: project,
    });

    if (!phase.project_id) {
      throw new BadRequestException("Phase must have a valid project_id");
    }

    const savedPhase = await this.phasesRepository.save(phase);
    const user = await this.usersService.findOne(userId);
    await this.activitiesService.createActivity(
      ActivityType.TASK_CREATED,
      `Phase "${savedPhase.title}" was created`,
      user,
      project,
      savedPhase,
      { phaseId: savedPhase.id }
    );

    if (createPhaseDto.tasks?.length) {
      for (const taskDto of createPhaseDto.tasks) {
        if (taskDto.id) {
          await this.tasksRepository.update(taskDto.id, {
            phase_id: savedPhase.id,
          });
        } else {
          const newTask = this.tasksRepository.create({
            ...taskDto,
            project_id: projectId,
            phase_id: savedPhase.id,
          });
          await this.tasksRepository.save(newTask);
        }
      }
    }
    return savedPhase;
  }

  async updatePhase(
    projectId: string,
    phaseId: string,
    updatePhaseDto: UpdatePhaseDto,
    userId: string
  ): Promise<Phase> {
    if (!projectId || projectId.trim() === "") {
      throw new BadRequestException(
        "Project ID is required when updating a phase"
      );
    }

    const project = await this.projectsRepository.findOne({
      where: { id: projectId },
    });
    if (!project) throw new NotFoundException("Project not found");

    const user = await this.usersService.findOne(userId);
    const isContractor = user?.role === "contractor";
    const isSubContractor = user?.role === "sub_contractor";
    const isAdmin = user?.role === "admin";
    const isConsultant = user?.role === "consultant";
    const isOwner = project.owner_id === userId;

    if (
      !isOwner &&
      !isContractor &&
      !isSubContractor &&
      !isAdmin &&
      !isConsultant
    ) {
      throw new ForbiddenException(
        "Only the project owner, contractor, sub_contractor, admin, or consultant can update a phase"
      );
    }

    const phase = await this.phasesRepository.findOne({
      where: { id: phaseId, project_id: projectId },
    });
    if (!phase) {
      throw new NotFoundException("Phase not found");
    }

    const updateData = {
      title: updatePhaseDto.title,
      description: updatePhaseDto.description,
      deliverables: updatePhaseDto.deliverables,
      requirements: updatePhaseDto.requirements,
      start_date: updatePhaseDto.startDate,
      end_date: updatePhaseDto.endDate,
      due_date: updatePhaseDto.dueDate,
      budget: updatePhaseDto.budget,
      progress: updatePhaseDto.progress,
      status: updatePhaseDto.status,
      parent_phase_id: updatePhaseDto.parentPhaseId || null,
      reference_task_id: updatePhaseDto.referenceTaskId || null,
    };

    if (!phase.project_id) {
      phase.project_id = projectId;
    }

    Object.assign(phase, updateData);

    if (!phase.project_id || phase.project_id.trim() === "") {
      throw new BadRequestException("Phase must have a valid project_id");
    }

    const updatedPhase = await this.phasesRepository.save(phase);
    await this.activitiesService.createActivity(
      ActivityType.TASK_UPDATED,
      `Phase "${updatedPhase.title}" was updated`,
      user,
      project,
      updatedPhase,
      { phaseId: updatedPhase.id }
    );

    if (
      updatePhaseDto.status === "completed" &&
      phase.status !== "completed"
    ) {
      const allPhases = await this.phasesRepository.find({
        where: { project_id: projectId },
      });
      const phaseNumber = allPhases.findIndex((p) => p.id === phaseId) + 1;
      const totalPhases = allPhases.length;
      await this.activitiesService.logPhaseCompleted(
        user,
        project,
        updatedPhase,
        phaseNumber,
        totalPhases
      );

      if (
        updatedPhase.end_date &&
        new Date(updatedPhase.end_date) < new Date()
      ) {
        await this.activitiesService.logPhaseOverdue(
          user,
          project,
          updatedPhase,
          phaseNumber,
          totalPhases
        );
      }
    }

    return updatedPhase;
  }

  async deletePhase(
    projectId: string,
    phaseId: string,
    userId: string
  ): Promise<void> {
    if (!projectId || projectId.trim() === "") {
      throw new BadRequestException(
        "Project ID is required when deleting a phase"
      );
    }

    const project = await this.projectsRepository.findOne({
      where: { id: projectId },
    });
    if (!project) throw new NotFoundException("Project not found");

    const user = await this.usersService.findOne(userId);
    const isContractor = user?.role === "contractor";
    const isSubContractor = user?.role === "sub_contractor";
    const isAdmin = user?.role === "admin";
    const isConsultant = user?.role === "consultant";
    const isOwner = project.owner_id === userId;

    if (
      !isOwner &&
      !isContractor &&
      !isSubContractor &&
      !isAdmin &&
      !isConsultant
    ) {
      throw new ForbiddenException(
        "Only the project owner, contractor, sub_contractor, admin, or consultant can delete a phase"
      );
    }

    const phase = await this.phasesRepository.findOne({
      where: { id: phaseId, project_id: projectId },
    });
    if (!phase) {
      throw new NotFoundException("Phase not found");
    }
    await this.phasesRepository.remove(phase);
    await this.activitiesService.createActivity(
      ActivityType.TASK_DELETED,
      `Phase "${phase.title}" was deleted`,
      user,
      project,
      phase,
      { phaseId: phase.id }
    );
  }

  async getProjectPhasesPaginated(
    projectId: string,
    userId: string,
    { page = 1, limit = 10 }: { page?: number; limit?: number }
  ) {
    const user = await this.usersService.findOne(userId);
    const isContractor = user?.role === "contractor";
    const isSubContractor = user?.role === "sub_contractor";

    if (!isContractor && !isSubContractor) {
      await this.projectsService.findOne(projectId, userId);
    } else {
      const project = await this.projectsRepository.findOne({
        where: { id: projectId },
      });
      if (!project) {
        throw new NotFoundException(`Project with ID ${projectId} not found`);
      }
    }

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    const [items, total] = await this.phasesRepository.findAndCount({
      where: { project_id: projectId, is_active: true },
      relations: ["subPhases", "subPhases.subPhases"],
      order: { created_at: "ASC" },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    });

    return {
      items,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  async getBoqDraftPhases(
    projectId: string,
    userId: string
  ): Promise<Phase[]> {
    await this.projectsService.findOne(projectId, userId);
    return this.phasesRepository.find({
      where: { project_id: projectId, from_boq: true, is_active: false },
      order: { created_at: "ASC" },
    });
  }

  async activateBoqPhases(
    projectId: string,
    phaseIds: string[],
    userId: string
  ): Promise<{ activated: number; phases: Phase[] }> {
    const project = await this.projectsService.findOne(projectId, userId);

    if (!phaseIds || phaseIds.length === 0) {
      throw new BadRequestException("No phase IDs provided");
    }

    const activatedPhases: Phase[] = [];

    for (const phaseId of phaseIds) {
      const phase = await this.phasesRepository.findOne({
        where: {
          id: phaseId,
          project_id: projectId,
          from_boq: true,
        },
      });

      if (!phase) {
        continue;
      }

      phase.is_active = true;
      await this.phasesRepository.save(phase);
      activatedPhases.push(phase);
    }

    try {
      const user = await this.usersService.findOne(userId);
      const totalPhases = await this.phasesRepository.count({
        where: { project_id: projectId, is_active: true },
      });

      for (let i = 0; i < activatedPhases.length; i++) {
        const phase = activatedPhases[i];
        try {
          await this.activitiesService.logPhaseCreated(
            user,
            project,
            phase,
            totalPhases - activatedPhases.length + i + 1,
            totalPhases
          );
        } catch (err) {
          // Ignore activity logging errors
        }
      }
    } catch (error) {
      // Ignore activity logging errors
    }

    return {
      activated: activatedPhases.length,
      phases: activatedPhases,
    };
  }

  async createPhasesFromBoqData(
    data: any[],
    projectId: string,
    userId: string
  ): Promise<Phase[]> {
    const project = await this.projectsRepository.findOne({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    const phases: Phase[] = [];
    const projectStartDate = project.start_date
      ? new Date(project.start_date)
      : new Date();
    const projectEndDate = project.end_date
      ? new Date(project.end_date)
      : new Date();
    const totalDays = Math.max(
      1,
      Math.ceil(
        (projectEndDate.getTime() - projectStartDate.getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );

    for (const row of data) {
      const description = row.Description || row.description || "";
      const unit = row.Unit || row.unit || "";
      const quantity =
        parseFloat(String(row.Quantity || row.quantity || 0)) || 0;
      const price = parseFloat(String(row.Price || row.price || 0)) || 0;
      const totalPrice =
        parseFloat(String(row["Total Price"] || row.totalPrice || 0)) || 0;

      const phaseData = {
        title: description || "Untitled Phase",
        description: `Unit: ${unit}, Quantity: ${quantity}`,
        budget: totalPrice || quantity * price,
        project_id: projectId,
        from_boq: true,
        is_active: false,
        status: PhaseStatus.NOT_STARTED,
        start_date: projectStartDate,
        end_date: projectEndDate,
      };

      const phase = this.phasesRepository.create({
        ...phaseData,
        project: project,
      });

      const savedPhase = await this.phasesRepository.save(phase);
      phases.push(savedPhase);
    }

    return phases;
  }
}


