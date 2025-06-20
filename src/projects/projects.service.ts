import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
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
    private readonly usersService: UsersService,
    private readonly activitiesService: ActivitiesService,
    private readonly tasksService: TasksService
  ) {}

  async findAll(userId: string): Promise<Project[]> {
    if (!userId) {
      throw new BadRequestException("User ID is required");
    }

    return this.projectsRepository.find({
      where: [{ owner_id: userId }, { collaborators: { id: userId } }],
      relations: ["owner", "collaborators", "phases"],
    });
  }

  async findOne(id: string, userId?: string): Promise<Project> {
    if (!id) {
      throw new BadRequestException("Project ID is required");
    }

    const project = await this.projectsRepository.findOne({
      where: { id },
      relations: [
        "owner",
        "collaborators",
        "phases",
        "phases.parent_phase",
        "phases.sub_phases",
      ],
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
      project.total_amount = totalAmount;
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
    await this.findOne(projectId, userId);

    // Validate assignee if specified
    if (createPhaseDto.assigneeId) {
      await this.validateAssignee(createPhaseDto.assigneeId);
    }

    // Map camelCase DTO fields to snake_case entity fields
    const phaseData = {
      title: createPhaseDto.title,
      description: createPhaseDto.description,
      work_description: createPhaseDto.workDescription,
      deliverables: createPhaseDto.deliverables,
      requirements: createPhaseDto.requirements,
      risks: createPhaseDto.risks,
      dependencies: createPhaseDto.dependencies,
      priority: createPhaseDto.priority,
      start_date: createPhaseDto.startDate,
      end_date: createPhaseDto.endDate,
      due_date: createPhaseDto.dueDate,
      estimated_hours: createPhaseDto.estimatedHours,
      budget: createPhaseDto.budget,
      spent: createPhaseDto.spent,
      progress: createPhaseDto.progress,
      status: createPhaseDto.status,
      assignee_id: createPhaseDto.assigneeId || null,
      parent_phase_id: createPhaseDto.parentPhaseId || null,
      reference_task_id: createPhaseDto.referenceTaskId || null,
      project_id: projectId,
    };
    const phase = this.phasesRepository.create(phaseData);
    const savedPhase = await this.phasesRepository.save(phase);

    // Create tasks if provided
    if (createPhaseDto.tasks?.length) {
      await this.createTasksRecursive(
        createPhaseDto.tasks,
        projectId,
        savedPhase.id
      );
    }

    return savedPhase;
  }

  async updatePhase(
    projectId: string,
    phaseId: string,
    updatePhaseDto: UpdatePhaseDto,
    userId: string
  ): Promise<Phase> {
    // Verify project access
    await this.findOne(projectId, userId);

    // Find the phase
    const phase = await this.phasesRepository.findOne({
      where: { id: phaseId, project_id: projectId },
    });

    if (!phase) {
      throw new NotFoundException("Phase not found");
    }

    // Validate assignee if specified
    if (updatePhaseDto.assigneeId) {
      await this.validateAssignee(updatePhaseDto.assigneeId);
    }

    // Map camelCase DTO fields to snake_case entity fields for update
    const updateData = {
      title: updatePhaseDto.title,
      description: updatePhaseDto.description,
      work_description: updatePhaseDto.workDescription,
      deliverables: updatePhaseDto.deliverables,
      requirements: updatePhaseDto.requirements,
      risks: updatePhaseDto.risks,
      dependencies: updatePhaseDto.dependencies,
      priority: updatePhaseDto.priority,
      start_date: updatePhaseDto.startDate,
      end_date: updatePhaseDto.endDate,
      due_date: updatePhaseDto.dueDate,
      estimated_hours: updatePhaseDto.estimatedHours,
      budget: updatePhaseDto.budget,
      spent: updatePhaseDto.spent,
      progress: updatePhaseDto.progress,
      status: updatePhaseDto.status,
      assignee_id: updatePhaseDto.assigneeId || null,
      parent_phase_id: updatePhaseDto.parentPhaseId || null,
      reference_task_id: updatePhaseDto.referenceTaskId || null,
    };
    Object.assign(phase, updateData);

    const updatedPhase = await this.phasesRepository.save(phase);

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

    return updatedPhase;
  }

  async deletePhase(
    projectId: string,
    phaseId: string,
    userId: string
  ): Promise<void> {
    // Verify project access
    await this.findOne(projectId, userId);

    // Find the phase
    const phase = await this.phasesRepository.findOne({
      where: { id: phaseId, project_id: projectId },
    });

    if (!phase) {
      throw new NotFoundException("Phase not found");
    }

    await this.phasesRepository.remove(phase);
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
    const completedPhases = phases.filter(
      (phase) => phase.status === "completed"
    ).length;
    const totalPhases = phases.length;
    // Calculate progress (average of phase progress or 0)
    let progress = 0;
    if (totalPhases > 0) {
      const totalProgress = phases.reduce(
        (sum, phase) => sum + (phase.progress || 0),
        0
      );
      progress = Math.round(totalProgress / totalPhases);
    }
    return {
      id: project.id,
      name: project.title,
      startDate: project.start_date,
      estimatedCompletion: project.end_date,
      progress,
      completedPhases,
      totalPhases,
      // ...add other fields as needed
    };
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

  private async validateAssignee(assigneeId: string): Promise<void> {
    try {
      await this.usersService.findOne(assigneeId);
    } catch (error) {
      throw new NotFoundException("Assignee not found");
    }
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
}
