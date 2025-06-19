import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DeepPartial } from "typeorm";
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

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    private usersService: UsersService,
    private activitiesService: ActivitiesService
  ) {}

  async findAll(userId: string): Promise<Project[]> {
    return this.projectsRepository.find({
      where: [{ owner_id: userId }, { collaborators: { id: userId } }],
      relations: ["owner", "collaborators", "phases", "phases.assignee"],
    });
  }

  async findOne(id: string, userId?: string): Promise<Project> {
    const project = await this.projectsRepository.findOne({
      where: { id },
      relations: [
        "owner",
        "collaborators",
        "phases",
        "phases.assignee",
        "phases.parent_phase",
        "phases.sub_phases",
        "phases.sub_phases.assignee",
      ],
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    if (
      userId &&
      project.owner_id !== userId &&
      !project.collaborators.some((c) => c.id === userId)
    ) {
      throw new ForbiddenException("You don't have access to this project");
    }

    // Sort phases by creation date
    if (project.phases) {
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
      const collaborators = await Promise.all(
        createProjectDto.collaborator_ids.map((id) =>
          this.usersService.findOne(id)
        )
      );
      project.collaborators = collaborators;
    }

    const savedProject = await this.projectsRepository.save(project);
    await this.activitiesService.logProjectCreated(owner, savedProject);

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
      const collaborators = await Promise.all(
        updateProjectDto.collaborator_ids.map((id) =>
          this.usersService.findOne(id)
        )
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

    project.collaborators = project.collaborators.filter(
      (c) => c.id !== collaboratorId
    );
    return this.projectsRepository.save(project);
  }

  private parseAmount(value: string | number | undefined): number {
    if (typeof value === "number") return value;
    if (!value) return 0;
    return Number(value.toString().replace(/[^0-9.-]+/g, ""));
  }

  async processBoqFile(
    projectId: string,
    file: Express.Multer.File,
    userId: string
  ): Promise<{ message: string; totalAmount: number; tasks: Task[] }> {
    console.log("\n=== BOQ File Processing Started ===");
    console.log(`File Name: ${file.originalname}`);
    console.log(`File Size: ${file.size} bytes`);
    console.log(`File Type: ${file.mimetype}`);

    // Verify project access
    const project = await this.findOne(projectId, userId);
    console.log(
      `\nProcessing BOQ for Project: ${project.title} (ID: ${project.id})`
    );

    try {
      // Read the Excel file
      const workbook = XLSX.read(file.buffer, { type: "buffer" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json<BoqRow>(worksheet);

      console.log("\n=== BOQ Data Analysis ===");
      console.log(`Total Rows in BOQ: ${data.length}`);

      // Find the total amount row
      const totalRow = data.find(
        (row) =>
          row["Description"]?.toLowerCase().includes("total") ||
          row["Description"]?.toLowerCase().includes("sum")
      );

      let totalAmount = 0;
      if (totalRow) {
        totalAmount =
          this.parseAmount(totalRow["Amount"]) ||
          this.parseAmount(totalRow["Total Amount"]) ||
          this.parseAmount(totalRow["Total Price"]);
        console.log(`\nFound Total Row:`);
        console.log(`Description: ${totalRow["Description"]}`);
        console.log(`Amount: ${totalAmount}`);
      } else {
        // Calculate total from all rows
        totalAmount = data.reduce((sum, row) => {
          const amount =
            this.parseAmount(row["Amount"]) ||
            this.parseAmount(row["Total Amount"]) ||
            this.parseAmount(row["Total Price"]);
          return sum + amount;
        }, 0);
        console.log(`\nNo Total Row Found - Calculated Total: ${totalAmount}`);
      }

      // Filter out total rows and create tasks
      const taskData = data.filter(
        (row) =>
          row["Description"] &&
          !row["Description"].toLowerCase().includes("total") &&
          !row["Description"].toLowerCase().includes("sum") &&
          row["Description"].trim() !== ""
      );

      console.log(`\n=== Task Creation ===`);
      console.log(`Number of Tasks to Create: ${taskData.length}`);

      const tasks: Task[] = [];
      for (const row of taskData) {
        const description = row["Description"] || "";
        const unit = row["Unit"] || "";
        const quantity = this.parseAmount(row["Quantity"] || row["Qty"]);
        const price = this.parseAmount(row["Price"] || row["Unit Price"]);

        if (description.trim()) {
          const task = this.tasksRepository.create({
            description,
            unit,
            quantity,
            price,
            project: { id: projectId },
          });
          tasks.push(task);
          console.log(
            `Created Task: ${description} (${quantity} ${unit} @ ${price})`
          );
        }
      }

      // Save all tasks
      const savedTasks = await this.tasksRepository.save(tasks);
      console.log(`\n=== Task Creation Complete ===`);
      console.log(`Successfully Created ${savedTasks.length} Tasks`);

      // Update project with total amount
      project.total_amount = totalAmount;
      await this.projectsRepository.save(project);
      console.log(`\nUpdated Project Total Amount: ${totalAmount}`);

      // Log activities
      await this.activitiesService.logBoqUploaded(
        project.owner,
        project,
        file.originalname,
        savedTasks.length,
        totalAmount
      );

      console.log("\n=== BOQ Processing Complete ===");
      return {
        message: `Successfully processed BOQ file and created ${savedTasks.length} tasks`,
        totalAmount,
        tasks: savedTasks,
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
  ): Promise<Task> {
    // Verify project access
    const project = await this.findOne(projectId, userId);

    // If parent phase is specified, verify it exists and belongs to the same project
    if (createPhaseDto.parent_phase_id) {
      const parentPhase = await this.tasksRepository.findOne({
        where: { id: createPhaseDto.parent_phase_id, project_id: projectId },
      });

      if (!parentPhase) {
        throw new NotFoundException("Parent phase not found");
      }
    }

    // If assignee is specified, verify they exist
    if (createPhaseDto.assignee_id) {
      const assignee = await this.usersService.findOne(
        createPhaseDto.assignee_id
      );
      if (!assignee) {
        throw new NotFoundException("Assignee not found");
      }
    }

    const phase = this.tasksRepository.create({
      ...createPhaseDto,
      project_id: projectId,
      start_date: createPhaseDto.start_date
        ? new Date(createPhaseDto.start_date)
        : null,
      end_date: createPhaseDto.end_date
        ? new Date(createPhaseDto.end_date)
        : null,
      due_date: createPhaseDto.due_date
        ? new Date(createPhaseDto.due_date)
        : null,
    });

    const savedPhase = await this.tasksRepository.save(phase);

    // Get current phase counts
    const totalPhases = await this.tasksRepository.count({
      where: { project_id: projectId },
    });
    const completedPhases = await this.tasksRepository.count({
      where: { project_id: projectId },
    });

    // Log phase creation
    await this.activitiesService.logPhaseCreated(
      project.owner,
      project,
      savedPhase,
      totalPhases,
      completedPhases
    );

    return this.tasksRepository.findOne({
      where: { id: savedPhase.id },
      relations: ["assignee", "parent_phase", "sub_phases"],
    });
  }

  async getProjectPhases(projectId: string, userId: string): Promise<Task[]> {
    // Verify project access
    await this.findOne(projectId, userId);

    return this.tasksRepository.find({
      where: { project_id: projectId },
      relations: [
        "assignee",
        "parent_phase",
        "sub_phases",
        "sub_phases.assignee",
      ],
      order: {
        created_at: "ASC",
      },
    });
  }

  async getAvailableAssignees(projectId: string): Promise<User[]> {
    // Get project to access collaborators
    const project = await this.projectsRepository.findOne({
      where: { id: projectId },
      relations: ["owner", "collaborators"],
    });

    if (!project) {
      throw new NotFoundException("Project not found");
    }

    // Return owner and collaborators as available assignees
    const assignees = [project.owner, ...project.collaborators];
    return assignees;
  }

  async updatePhase(
    projectId: string,
    phaseId: string,
    updatePhaseDto: UpdatePhaseDto,
    userId: string
  ): Promise<Task> {
    // Verify project access
    const project = await this.findOne(projectId, userId);

    // Find the phase
    const phase = await this.tasksRepository.findOne({
      where: { id: phaseId, project_id: projectId },
      relations: ["assignee", "parent_phase", "sub_phases"],
    });

    if (!phase) {
      throw new NotFoundException("Phase not found");
    }

    // If parent phase is specified, verify it exists and belongs to the same project
    if (updatePhaseDto.parent_phase_id) {
      const parentPhase = await this.tasksRepository.findOne({
        where: { id: updatePhaseDto.parent_phase_id, project_id: projectId },
      });

      if (!parentPhase) {
        throw new NotFoundException("Parent phase not found");
      }

      // Prevent circular references
      if (updatePhaseDto.parent_phase_id === phaseId) {
        throw new BadRequestException("A phase cannot be its own parent");
      }
    }

    // If assignee is specified, verify they exist
    if (updatePhaseDto.assignee_id) {
      const assignee = await this.usersService.findOne(
        updatePhaseDto.assignee_id
      );
      if (!assignee) {
        throw new NotFoundException("Assignee not found");
      }
    }

    // Store old values for activity logging
    const oldBudget = phase.budget;
    const oldProgress = phase.progress;

    // Update phase
    const updatedPhase = await this.tasksRepository.save({
      ...phase,
      ...updatePhaseDto,
      start_date: updatePhaseDto.start_date
        ? new Date(updatePhaseDto.start_date)
        : phase.start_date,
      end_date: updatePhaseDto.end_date
        ? new Date(updatePhaseDto.end_date)
        : phase.end_date,
      due_date: updatePhaseDto.due_date
        ? new Date(updatePhaseDto.due_date)
        : phase.due_date,
    });

    // Get current phase counts
    const totalPhases = await this.tasksRepository.count({
      where: { project_id: projectId },
    });
    const completedPhases = await this.tasksRepository.count({
      where: { project_id: projectId },
    });

    // Log activities based on what was updated
    if (
      updatePhaseDto.budget !== undefined &&
      updatePhaseDto.budget !== oldBudget
    ) {
      await this.activitiesService.logPhaseBudgetUpdate(
        project.owner,
        project,
        updatedPhase,
        totalPhases,
        completedPhases,
        oldBudget || 0,
        updatePhaseDto.budget
      );
    }

    if (
      updatePhaseDto.progress !== undefined &&
      updatePhaseDto.progress !== oldProgress
    ) {
      await this.activitiesService.logPhaseProgress(
        project.owner,
        project,
        updatedPhase,
        totalPhases,
        completedPhases,
        updatePhaseDto.progress
      );
    }

    return this.tasksRepository.findOne({
      where: { id: updatedPhase.id },
      relations: ["assignee", "parent_phase", "sub_phases"],
    });
  }

  async deletePhase(
    projectId: string,
    phaseId: string,
    userId: string
  ): Promise<void> {
    // Verify project access
    const project = await this.findOne(projectId, userId);

    // Find the phase
    const phase = await this.tasksRepository.findOne({
      where: { id: phaseId, project_id: projectId },
      relations: ["sub_phases"],
    });

    if (!phase) {
      throw new NotFoundException("Phase not found");
    }

    // Check if phase has sub-phases
    if (phase.sub_phases && phase.sub_phases.length > 0) {
      throw new BadRequestException(
        "Cannot delete phase with sub-phases. Please delete or reassign sub-phases first."
      );
    }

    // Get current phase counts before deletion
    const totalPhases = await this.tasksRepository.count({
      where: { project_id: projectId },
    });
    const completedPhases = await this.tasksRepository.count({
      where: { project_id: projectId, status: TaskStatus.COMPLETED },
    });

    // Delete the phase
    await this.tasksRepository.remove(phase);

    // Log the deletion
    await this.activitiesService.logPhaseDeleted(
      project.owner,
      project,
      phase,
      totalPhases - 1, // Subtract 1 since we just deleted one
      completedPhases
    );
  }
}
