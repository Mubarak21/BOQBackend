import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
  forwardRef,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import {
  Project,
  ProjectStatus,
  ProjectPriority,
} from "../entities/project.entity";
import { User } from "../entities/user.entity";
import { Task } from "../entities/task.entity";
import { CreateProjectDto } from "./dto/create-project.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";
import * as XLSX from "xlsx";
import { ActivitiesService } from "../activities/activities.service";
import { UsersService } from "../users/users.service";
import { CreatePhaseDto } from "./dto/create-phase.dto";
import { UpdatePhaseDto } from "./dto/update-phase.dto";
import { Phase } from "../entities/phase.entity";
import { TasksService } from "../tasks/tasks.service";
import {
  ProjectAccessRequest,
  ProjectAccessRequestStatus,
} from "../entities/project-access-request.entity";
import { ActivityType } from "../entities/activity.entity";
import { PhaseStatus } from "../entities/phase.entity";

interface BoqRow {
  Description?: string;
  Unit?: string;
  Quantity?: number | string;
  Qty?: number | string;
  Price?: number | string;
  "Unit Price"?: number | string;
  Amount?: number | string;
  "Total Amount"?: number | string;
  "Total Price"?: number | string;
}

export interface ProcessBoqResult {
  message: string;
  totalAmount: number;
  tasks: Task[];
}

interface CreateTaskDto {
  description: string;
  unit?: string;
  quantity?: number;
  price?: number;
  subTasks?: CreateTaskDto[];
}

// Utility to normalize column names
function normalizeColumnName(name: string): string {
  return name.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
}

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectsRepository: Repository<Project>,
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
    @InjectRepository(Phase)
    private readonly phasesRepository: Repository<Phase>,
    @InjectRepository(ProjectAccessRequest)
    private readonly accessRequestRepository: Repository<ProjectAccessRequest>,
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => ActivitiesService))
    private readonly activitiesService: ActivitiesService,
    private readonly tasksService: TasksService
  ) {}

  async findAll(): Promise<Project[]> {
    return this.projectsRepository.find({
      relations: ["owner", "collaborators", "phases"],
    });
  }

  async findOne(id: string, userId?: string): Promise<Project> {
    if (!id) {
      throw new BadRequestException("Project ID is required");
    }

    const project = await this.projectsRepository.findOne({
      where: { id },
      relations: ["owner", "collaborators", "phases"],
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    if (userId && !this.hasProjectAccess(project, userId)) {
      throw new ForbiddenException("You don't have access to this project");
    }

    // Sort phases by creation date
    if (project.phases?.length > 0) {
      project.phases.sort(
        (a, b) => a.created_at.getTime() - b.created_at.getTime()
      );
    }

    return project;
  }

  async create(
    createProjectDto: CreateProjectDto,
    owner: User
  ): Promise<Project> {
    if (!owner?.id) {
      throw new BadRequestException("Owner is required");
    }

    const project = this.projectsRepository.create({
      title: createProjectDto.title,
      description: createProjectDto.description,
      status: createProjectDto.status,
      priority: createProjectDto.priority,
      start_date: createProjectDto.start_date
        ? new Date(createProjectDto.start_date)
        : null,
      end_date: createProjectDto.end_date
        ? new Date(createProjectDto.end_date)
        : null,
      tags: createProjectDto.tags,
      owner_id: owner.id,
      totalAmount: createProjectDto.totalAmount ?? 0,
    });

    // Handle collaborators if provided
    if (createProjectDto.collaborator_ids?.length) {
      const collaborators = await this.getValidatedCollaborators(
        createProjectDto.collaborator_ids
      );
      project.collaborators = collaborators;
    }

    const savedProject = await this.projectsRepository.save(project);

    try {
      await this.activitiesService.logProjectCreated(owner, savedProject, null);
    } catch (error) {
      console.warn("Failed to log project creation activity:", error);
    }

    return this.findOne(savedProject.id);
  }

  async update(
    id: string,
    updateProjectDto: UpdateProjectDto,
    userId: string
  ): Promise<Project> {
    const project = await this.findOne(id);

    if (project.owner_id !== userId) {
      throw new ForbiddenException(
        "Only the project owner can update the project"
      );
    }

    // Handle collaborators update if provided
    if (updateProjectDto.collaborator_ids) {
      const collaborators = await this.getValidatedCollaborators(
        updateProjectDto.collaborator_ids
      );
      project.collaborators = collaborators;
    }

    // Handle date updates
    const updateData = {
      ...updateProjectDto,
      start_date: updateProjectDto.start_date
        ? new Date(updateProjectDto.start_date)
        : project.start_date,
      end_date: updateProjectDto.end_date
        ? new Date(updateProjectDto.end_date)
        : project.end_date,
    };

    Object.assign(project, updateData);
    return this.projectsRepository.save(project);
  }

  async remove(id: string, userId: string): Promise<void> {
    const project = await this.findOne(id);

    if (project.owner_id !== userId) {
      throw new ForbiddenException(
        "Only the project owner can delete the project"
      );
    }

    await this.projectsRepository.remove(project);
  }

  async addCollaborator(
    projectId: string,
    collaborator: User,
    userId: string
  ): Promise<Project> {
    const project = await this.findOne(projectId);

    if (project.owner_id !== userId) {
      throw new ForbiddenException(
        "Only the project owner can add collaborators"
      );
    }

    if (!project.collaborators) {
      project.collaborators = [];
    }

    if (project.collaborators.some((c) => c.id === collaborator.id)) {
      throw new BadRequestException("User is already a collaborator");
    }

    if (project.owner_id === collaborator.id) {
      throw new BadRequestException("Owner cannot be added as collaborator");
    }

    project.collaborators.push(collaborator);
    return this.projectsRepository.save(project);
  }

  async removeCollaborator(
    projectId: string,
    collaboratorId: string,
    userId: string
  ): Promise<Project> {
    const project = await this.findOne(projectId);

    if (project.owner_id !== userId) {
      throw new ForbiddenException(
        "Only the project owner can remove collaborators"
      );
    }

    const initialLength = project.collaborators?.length || 0;
    project.collaborators =
      project.collaborators?.filter((c) => c.id !== collaboratorId) || [];

    if (project.collaborators.length === initialLength) {
      throw new NotFoundException("Collaborator not found in project");
    }

    return this.projectsRepository.save(project);
  }

  async processBoqFile(
    projectId: string,
    file: Express.Multer.File,
    userId: string
  ): Promise<ProcessBoqResult> {
    console.log("\n=== BOQ File Processing Started ===");
    console.log(`File Name: ${file.originalname}`);
    console.log(`File Size: ${file.size} bytes`);
    console.log(`File Type: ${file.mimetype}`);

    // Verify project access
    const project = await this.findOne(projectId, userId);
    console.log(
      `\nProcessing BOQ for Project: ${project.title} (ID: ${project.id})`
    );

    if (!file?.buffer) {
      throw new BadRequestException("No file uploaded or file buffer missing");
    }

    try {
      const { data, totalAmount } = await this.parseBoqFile(file);
      const tasks = await this.createTasksFromBoqData(data, projectId);

      // Update project with total amount
      project.totalAmount = totalAmount;
      await this.projectsRepository.save(project);

      // Log activities
      try {
        await this.activitiesService.logBoqUploaded(
          project.owner,
          project,
          file.originalname,
          tasks.length,
          totalAmount
        );
      } catch (error) {
        console.warn("Failed to log BOQ upload activity:", error);
      }

      console.log("\n=== BOQ Processing Complete ===");
      return {
        message: `Successfully processed BOQ file and created ${tasks.length} tasks`,
        totalAmount,
        tasks,
      };
    } catch (error) {
      console.error("\n=== BOQ Processing Error ===");
      console.error("Error processing BOQ file:", error);
      throw new BadRequestException(
        `Failed to process BOQ file: ${error.message}`
      );
    }
  }

  async createPhase(
    projectId: string,
    createPhaseDto: CreatePhaseDto,
    userId: string
  ): Promise<Phase> {
    // Verify project access
    const project = await this.findOne(projectId, userId);
    // Prevent duplicate phase titles for the same project
    const existingPhase = await this.phasesRepository.findOne({
      where: { project_id: projectId, title: createPhaseDto.title },
    });
    if (existingPhase) {
      throw new BadRequestException(
        "A phase with this title already exists for this project."
      );
    }
    // Remove references to assigneeId, estimatedHours, and workDescription
    // if (createPhaseDto.assigneeId) {
    //   await this.validateAssignee(createPhaseDto.assigneeId);
    // }
    // Map camelCase DTO fields to snake_case entity fields
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
    const phaseData = {
      title: createPhaseDto.title,
      description: createPhaseDto.description,
      deliverables: createPhaseDto.deliverables,
      requirements: createPhaseDto.requirements,
      risks: createPhaseDto.risks,
      priority: createPhaseDto.priority,
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
    const phase = this.phasesRepository.create(phaseData);
    const savedPhase = await this.phasesRepository.save(phase);
    // Log activity for phase creation
    const user = await this.usersService.findOne(userId);
    await this.activitiesService.createActivity(
      ActivityType.TASK_CREATED,
      `Phase "${savedPhase.title}" was created`,
      user,
      project,
      savedPhase,
      { phaseId: savedPhase.id }
    );
    // Create tasks if provided
    if (createPhaseDto.tasks?.length) {
      for (const taskDto of createPhaseDto.tasks) {
        // Use the id field from CreateTaskDto (now added)
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
    // After creating the phase, update the project's total_phases to sum of all phase budgets
    const allPhasesForTotal = await this.phasesRepository.find({
      where: { project_id: projectId },
    });
    const totalPhasesAmount = allPhasesForTotal.reduce(
      (sum, phase) => sum + (Number(phase.budget) || 0),
      0
    );
    await this.projectsRepository.update(projectId, {
      total_phases: totalPhasesAmount,
    });
    return savedPhase;
  }

  async updatePhase(
    projectId: string,
    phaseId: string,
    updatePhaseDto: UpdatePhaseDto,
    userId: string
  ): Promise<Phase> {
    // Only the project owner can update a phase
    const project = await this.projectsRepository.findOne({
      where: { id: projectId },
    });
    if (!project) throw new NotFoundException("Project not found");
    if (project.owner_id !== userId) {
      throw new ForbiddenException("Only the project owner can update a phase");
    }
    // Find the phase
    const phase = await this.phasesRepository.findOne({
      where: { id: phaseId, project_id: projectId },
    });
    if (!phase) {
      throw new NotFoundException("Phase not found");
    }
    // Map camelCase DTO fields to snake_case entity fields for update
    const updateData = {
      title: updatePhaseDto.title,
      description: updatePhaseDto.description,
      deliverables: updatePhaseDto.deliverables,
      requirements: updatePhaseDto.requirements,
      risks: updatePhaseDto.risks,
      priority: updatePhaseDto.priority,
      start_date: updatePhaseDto.startDate,
      end_date: updatePhaseDto.endDate,
      due_date: updatePhaseDto.dueDate,
      budget: updatePhaseDto.budget,
      progress: updatePhaseDto.progress,
      status: updatePhaseDto.status,
      parent_phase_id: updatePhaseDto.parentPhaseId || null,
      reference_task_id: updatePhaseDto.referenceTaskId || null,
    };
    Object.assign(phase, updateData);
    const updatedPhase = await this.phasesRepository.save(phase);
    // Log activity for phase update
    const user = await this.usersService.findOne(userId);
    await this.activitiesService.createActivity(
      ActivityType.TASK_UPDATED,
      `Phase "${updatedPhase.title}" was updated`,
      user,
      project,
      updatedPhase,
      { phaseId: updatedPhase.id }
    );
    // Log phase completion and overdue
    if (updatePhaseDto.status === "completed" && phase.status !== "completed") {
      const project = await this.projectsRepository.findOne({
        where: { id: projectId },
      });
      const user = await this.usersService.findOne(userId);
      const allPhases = await this.phasesRepository.find({
        where: { project_id: projectId },
      });
      const phaseNumber = allPhases.findIndex((p) => p.id === phaseId) + 1;
      const totalPhases = allPhases.length;
      // Log phase completed
      await this.activitiesService.logPhaseCompleted(
        user,
        project,
        updatedPhase,
        phaseNumber,
        totalPhases
      );
      // Log overdue if end_date is before today
      if (
        updatedPhase.end_date &&
        new Date(updatedPhase.end_date) < new Date()
      ) {
        const delayDays = Math.ceil(
          (new Date().getTime() - new Date(updatedPhase.end_date).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        await this.activitiesService.logPhaseDelay(
          user,
          project,
          updatedPhase,
          phaseNumber,
          totalPhases,
          delayDays
        );
      }
    }
    // After updating the phase, update the project's total_phases to sum of all phase budgets
    const allPhasesForTotal = await this.phasesRepository.find({
      where: { project_id: projectId },
    });
    const totalPhasesAmount = allPhasesForTotal.reduce(
      (sum, phase) => sum + (Number(phase.budget) || 0),
      0
    );
    await this.projectsRepository.update(projectId, {
      total_phases: totalPhasesAmount,
    });
    return updatedPhase;
  }

  async deletePhase(
    projectId: string,
    phaseId: string,
    userId: string
  ): Promise<void> {
    // Only the project owner can delete a phase
    const project = await this.projectsRepository.findOne({
      where: { id: projectId },
    });
    if (!project) throw new NotFoundException("Project not found");
    if (project.owner_id !== userId) {
      throw new ForbiddenException("Only the project owner can delete a phase");
    }
    // Find the phase
    const phase = await this.phasesRepository.findOne({
      where: { id: phaseId, project_id: projectId },
    });
    if (!phase) {
      throw new NotFoundException("Phase not found");
    }
    await this.phasesRepository.remove(phase);
    // Log activity for phase deletion
    const user = await this.usersService.findOne(userId);
    await this.activitiesService.createActivity(
      ActivityType.TASK_DELETED,
      `Phase "${phase.title}" was deleted`,
      user,
      project,
      phase,
      { phaseId: phase.id }
    );
    // After deleting the phase, update the project's total_phases to sum of all phase budgets
    const allPhasesForTotal = await this.phasesRepository.find({
      where: { project_id: projectId },
    });
    const totalPhasesAmount = allPhasesForTotal.reduce(
      (sum, phase) => sum + (Number(phase.budget) || 0),
      0
    );
    await this.projectsRepository.update(projectId, {
      total_phases: totalPhasesAmount,
    });
  }

  async getProjectPhases(projectId: string, userId: string): Promise<Phase[]> {
    // Verify project access
    await this.findOne(projectId, userId);

    return this.phasesRepository.find({
      where: { project_id: projectId },
      order: { created_at: "ASC" },
    });
  }

  async getAvailableAssignees(projectId: string): Promise<User[]> {
    const project = await this.projectsRepository.findOne({
      where: { id: projectId },
      relations: ["owner", "collaborators"],
    });

    if (!project) {
      throw new NotFoundException("Project not found");
    }

    // Return owner and collaborators as available assignees
    return [project.owner, ...(project.collaborators || [])];
  }

  async getProjectResponse(project: Project): Promise<any> {
    // Calculate completed and total phases
    const phases = project.phases || [];
    const totalPhases = phases.length;
    let progress = 0;
    if (totalPhases > 0) {
      // Sum all phase progresses (each phase progress is 0-100)
      const totalProgress = phases.reduce(
        (sum, phase) => sum + (phase.progress || 0),
        0
      );
      // Project progress is the sum of all phase progresses divided by number of phases
      progress = Math.round(totalProgress / totalPhases);
      // Cap at 100
      if (progress > 100) progress = 100;
    }
    const completedPhases = phases.filter(
      (phase) => phase.status === "completed"
    ).length;
    return {
      id: project.id,
      name: project.title,
      description: project.description,
      progress,
      completedPhases,
      totalPhases,
      totalAmount: project.totalAmount,
      totalPhasesAmount: project.total_phases,
      startDate: project.start_date,
      estimatedCompletion: project.end_date,
      owner: project.owner?.display_name || project.owner_id,
      collaborators: (project.collaborators || []).map(
        (c) => c.display_name || c.id
      ),
      tags: project.tags,
      phases: phases,
    };
  }

  async findAllProjects(): Promise<Project[]> {
    return this.projectsRepository.find({
      relations: ["owner", "collaborators", "phases"],
    });
  }

  async joinProject(projectId: string, user: User): Promise<Project> {
    const project = await this.findOne(projectId);

    if (project.owner_id === user.id) {
      throw new BadRequestException("Owner cannot join as collaborator");
    }
    if (project.collaborators?.some((c) => c.id === user.id)) {
      throw new BadRequestException("User is already a collaborator");
    }
    if (!project.collaborators) {
      project.collaborators = [];
    }
    project.collaborators.push(user);
    await this.activitiesService.logCollaboratorAdded(user, project, user);
    return this.projectsRepository.save(project);
  }

  async createJoinRequest(projectId: string, requesterId: string) {
    // Check for existing pending request
    const existing = await this.accessRequestRepository.findOne({
      where: {
        project_id: projectId,
        requester_id: requesterId,
        status: "pending",
      },
    });
    if (existing)
      throw new BadRequestException("A pending join request already exists.");
    const request = this.accessRequestRepository.create({
      project_id: projectId,
      requester_id: requesterId,
      status: "pending",
    });
    const savedRequest = await this.accessRequestRepository.save(request);
    return savedRequest;
  }

  async listJoinRequestsForProject(projectId: string, ownerId: string) {
    const project = await this.projectsRepository.findOne({
      where: { id: projectId },
    });
    if (!project) throw new NotFoundException("Project not found");
    if (project.owner_id !== ownerId)
      throw new ForbiddenException("Only the owner can view join requests");
    return this.accessRequestRepository.find({
      where: { project_id: projectId },
      order: { created_at: "DESC" },
    });
  }

  async approveJoinRequest(
    projectId: string,
    requestId: string,
    ownerId: string
  ) {
    const project = await this.projectsRepository.findOne({
      where: { id: projectId },
      relations: ["collaborators"],
    });
    if (!project) throw new NotFoundException("Project not found");
    if (project.owner_id !== ownerId)
      throw new ForbiddenException("Only the owner can approve join requests");
    const request = await this.accessRequestRepository.findOne({
      where: { id: requestId, project_id: projectId },
    });
    if (!request) throw new NotFoundException("Join request not found");
    if (request.status !== "pending")
      throw new BadRequestException("Request is not pending");
    // Add user as collaborator
    const user = await this.usersService.findOne(request.requester_id);
    if (!project.collaborators.some((c) => c.id === user.id)) {
      project.collaborators.push(user);
      await this.projectsRepository.save(project);
    }
    request.status = "approved";
    request.reviewed_at = new Date();
    return this.accessRequestRepository.save(request);
  }

  async denyJoinRequest(projectId: string, requestId: string, ownerId: string) {
    const project = await this.projectsRepository.findOne({
      where: { id: projectId },
    });
    if (!project) throw new NotFoundException("Project not found");
    if (project.owner_id !== ownerId)
      throw new ForbiddenException("Only the owner can deny join requests");
    const request = await this.accessRequestRepository.findOne({
      where: { id: requestId, project_id: projectId },
    });
    if (!request) throw new NotFoundException("Join request not found");
    if (request.status !== "pending")
      throw new BadRequestException("Request is not pending");
    request.status = "denied";
    request.reviewed_at = new Date();
    return this.accessRequestRepository.save(request);
  }

  async listMyJoinRequests(userId: string) {
    return this.accessRequestRepository.find({
      where: { requester_id: userId },
      order: { created_at: "DESC" },
    });
  }

  async listJoinRequestsForOwner(ownerId: string) {
    const projects = await this.projectsRepository.find({
      where: { owner_id: ownerId },
    });
    const projectIds = projects.map((p) => p.id);
    if (projectIds.length === 0) return [];
    return this.accessRequestRepository.find({
      where: { project_id: In(projectIds) },
      order: { created_at: "DESC" },
    });
  }

  async getAvailablePhaseTasks(
    projectId: string,
    userId: string
  ): Promise<Task[]> {
    // Verify project access
    await this.findOne(projectId, userId);

    // Get all tasks for the project
    const allTasks = await this.tasksRepository.find({
      where: { project_id: projectId },
    });

    // Exclude tasks that are already assigned to a phase
    return allTasks.filter((task) => !task.phase_id);
  }

  // Private helper methods
  private hasProjectAccess(project: Project, userId: string): boolean {
    return (
      project.owner_id === userId ||
      project.collaborators?.some((c) => c.id === userId) ||
      false
    );
  }

  private async getValidatedCollaborators(
    collaboratorIds: string[]
  ): Promise<User[]> {
    const collaborators = await Promise.all(
      collaboratorIds.map(async (id) => {
        try {
          return await this.usersService.findOne(id);
        } catch (error) {
          throw new BadRequestException(`Collaborator with ID ${id} not found`);
        }
      })
    );
    return collaborators;
  }

  private parseAmount(value: string | number | undefined): number {
    if (typeof value === "number") return value;
    if (!value) return 0;

    const numStr = value.toString().replace(/[^0-9.-]+/g, "");
    const parsed = Number(numStr);
    return isNaN(parsed) ? 0 : parsed;
  }

  private async parseBoqFile(file: Express.Multer.File): Promise<{
    data: any[];
    totalAmount: number;
  }> {
    console.log("[DEBUG] Reading Excel file buffer...");
    const workbook = XLSX.read(file.buffer, { type: "buffer" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    if (!worksheet) {
      throw new BadRequestException("No worksheet found in uploaded file");
    }

    // Convert worksheet to JSON
    const data = XLSX.utils.sheet_to_json<any>(worksheet, { defval: "" });
    console.log(`[DEBUG] Parsed ${data.length} rows from Excel file`);

    // Get column mappings
    const columnMappings = this.getColumnMappings(worksheet);
    const { descriptionCol, quantityCol, priceCol } = columnMappings;

    // Calculate total amount
    const totalRow = data.find(
      (row) =>
        row[descriptionCol]?.toLowerCase().includes("total") ||
        row[descriptionCol]?.toLowerCase().includes("sum")
    );

    let totalAmount = 0;
    if (totalRow) {
      totalAmount =
        this.parseAmount(totalRow[quantityCol]) ||
        this.parseAmount(totalRow[priceCol]);
      console.log(`Found total row with amount: ${totalAmount}`);
    } else {
      totalAmount = data.reduce((sum, row) => {
        const amount =
          this.parseAmount(row[quantityCol]) || this.parseAmount(row[priceCol]);
        return sum + amount;
      }, 0);
      console.log(`Calculated total amount: ${totalAmount}`);
    }

    // Filter valid data rows
    const validData = data.filter(
      (row) =>
        row[descriptionCol] &&
        typeof row[descriptionCol] === "string" &&
        !row[descriptionCol].toLowerCase().includes("total") &&
        !row[descriptionCol].toLowerCase().includes("sum") &&
        row[descriptionCol].trim() !== ""
    );

    return { data: validData, totalAmount };
  }

  private getColumnMappings(worksheet: XLSX.WorkSheet) {
    const headerRow =
      XLSX.utils.sheet_to_json<any>(worksheet, {
        header: 1,
        range: 0,
        blankrows: false,
      })[0] || [];

    const normalizedMap: Record<string, string> = {};
    for (const col of headerRow) {
      if (typeof col === "string") {
        normalizedMap[normalizeColumnName(col)] = col;
      }
    }

    const columnSynonyms = {
      description: [
        "description",
        "desc",
        "itemdescription",
        "workdescription",
      ],
      unit: ["unit", "units", "uom"],
      quantity: ["quantity", "qty", "quantities"],
      price: [
        "price",
        "unitprice",
        "rate",
        "amount",
        "totalprice",
        "totalamount",
      ],
    };

    const findColumn = (
      field: keyof typeof columnSynonyms
    ): string | undefined => {
      for (const synonym of columnSynonyms[field]) {
        const norm = normalizeColumnName(synonym);
        if (normalizedMap[norm]) return normalizedMap[norm];
      }
      return undefined;
    };

    return {
      descriptionCol: findColumn("description"),
      unitCol: findColumn("unit"),
      quantityCol: findColumn("quantity"),
      priceCol: findColumn("price"),
    };
  }

  private async createTasksFromBoqData(
    data: any[],
    projectId: string
  ): Promise<Task[]> {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const columnMappings = this.getColumnMappings(worksheet);
    const { descriptionCol, unitCol, quantityCol, priceCol } = columnMappings;

    const tasks: Task[] = [];
    console.log(`Creating ${data.length} tasks from BOQ data`);

    for (const row of data) {
      const description = row[descriptionCol] || "";
      const unit = unitCol ? row[unitCol] || "" : "";
      const quantity = this.parseAmount(
        quantityCol ? row[quantityCol] : undefined
      );
      const price = this.parseAmount(priceCol ? row[priceCol] : undefined);

      if (description.trim()) {
        const task = this.tasksRepository.create({
          description: description.trim(),
          unit: unit.trim(),
          quantity,
          price,
          project: { id: projectId } as any,
        });

        const savedTask = await this.tasksRepository.save(task);
        tasks.push(savedTask);

        console.log(
          `Created task: ${description} (${quantity} ${unit} @ ${price})`
        );
      }
    }

    return tasks;
  }

  private async createTasksRecursive(
    tasks: CreateTaskDto[],
    projectId: string,
    phaseId: string,
    parentTaskId: string | null = null
  ): Promise<void> {
    for (const taskDto of tasks) {
      const { subTasks, ...taskData } = taskDto;

      const task = this.tasksRepository.create({
        ...taskData,
        project_id: projectId,
        phase_id: phaseId,
        parent_task_id: parentTaskId,
      });

      const savedTask = await this.tasksRepository.save(task);

      if (subTasks?.length) {
        await this.createTasksRecursive(
          subTasks,
          projectId,
          phaseId,
          savedTask.id
        );
      }
    }
  }

  // Utility: Filter project for consultant-facing fields only
  getConsultantProjectSummary(project: Project) {
    return {
      id: project.id,
      title: project.title,
      description: project.description,
      status: project.status,
      priority: project.priority,
      start_date: project.start_date,
      end_date: project.end_date,
      totalAmount: project.totalAmount,
      tags: project.tags,
      created_at: project.created_at,
      updated_at: project.updated_at,
      department: project.department
        ? { id: project.department.id, name: project.department.name }
        : undefined,
      // Add more public fields as needed
    };
  }

  // Consultant: List all projects (summary info)
  async getAllConsultantProjects(): Promise<any[]> {
    const projects = await this.projectsRepository.find({
      relations: ["phases", "owner", "collaborators"],
    });
    return projects.map((project) => ({
      id: project.id,
      name: project.title,
      owner: project.owner?.display_name || project.owner_id,
      collaborators: (project.collaborators || []).map(
        (c) => c.display_name || c.id
      ),
      startDate: project.start_date,
      estimatedCompletion: project.end_date,
      phases: (project.phases || []).map((phase) => ({
        id: phase.id,
        name: phase.title,
        status: phase.status,
        startDate: phase.start_date,
        endDate: phase.end_date,
      })),
    }));
  }

  // Consultant: Get project details (consultant-facing)
  async getConsultantProjectDetails(id: string): Promise<any> {
    const project = await this.projectsRepository.findOne({
      where: { id },
      relations: ["phases", "phases.subPhases", "owner", "collaborators"],
    });
    if (!project) throw new NotFoundException("Project not found");
    return {
      id: project.id,
      name: project.title,
      owner: project.owner?.display_name || project.owner_id,
      collaborators: (project.collaborators || []).map(
        (c) => c.display_name || c.id
      ),
      startDate: project.start_date,
      estimatedCompletion: project.end_date,
      phases: (project.phases || []).map((phase) => ({
        id: phase.id,
        name: phase.title,
        status: phase.status,
        startDate: phase.start_date,
        endDate: phase.end_date,
        sub_phases: (phase.subPhases || []).map((sub) => ({
          id: sub.id,
          title: sub.title,
          description: sub.description,
          isCompleted: sub.isCompleted,
        })),
      })),
    };
  }

  // Consultant: Get phases for a project (consultant-facing)
  async getConsultantProjectPhases(projectId: string): Promise<any[]> {
    const phases = await this.phasesRepository.find({
      where: { project_id: projectId },
      relations: ["subPhases"],
    });
    // Return public fields for phases and their subPhases
    return phases.map((phase) => ({
      id: phase.id,
      title: phase.title,
      description: phase.description,
      start_date: phase.start_date,
      end_date: phase.end_date,
      progress: phase.progress,
      status: phase.status,
      created_at: phase.created_at,
      updated_at: phase.updated_at,
      subPhases: (phase.subPhases || []).map((sub) => ({
        id: sub.id,
        title: sub.title,
        description: sub.description,
        isCompleted: sub.isCompleted,
      })),
    }));
  }

  // Consultant: Get tasks for a project (consultant-facing)
  async getConsultantProjectTasks(projectId: string): Promise<any[]> {
    const tasks = await this.tasksRepository.find({
      where: { project_id: projectId },
    });
    // Only return public fields for tasks
    return tasks.map((task) => ({
      id: task.id,
      description: task.description,
      unit: task.unit,
      quantity: task.quantity,
      price: task.price,
      phase_id: task.phase_id,
      created_at: task.created_at,
      updated_at: task.updated_at,
    }));
  }
}
