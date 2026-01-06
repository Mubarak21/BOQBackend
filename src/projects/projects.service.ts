import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
  forwardRef,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In, Between, Like } from "typeorm";
import {
  Project,
  ProjectStatus,
  ProjectPriority,
} from "../entities/project.entity";
import { User, UserRole } from "../entities/user.entity";
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
import { DashboardService } from "../dashboard/dashboard.service";
import { BoqParserService } from "./boq-parser.service";
import { Inventory, InventoryCategory } from "../entities/inventory.entity";
import * as path from "path";
import * as fs from "fs";

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
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => ActivitiesService))
    private readonly activitiesService: ActivitiesService,
    private readonly tasksService: TasksService,
    @Inject(forwardRef(() => DashboardService))
    private readonly dashboardService: DashboardService,
    private readonly boqParserService: BoqParserService
  ) {}

  async findAll(): Promise<Project[]> {
    return this.projectsRepository.find({
      relations: ["owner", "collaborators", "phases"],
    });
  }

  async findAllPaginated({
    page = 1,
    limit = 10,
    search,
    status,
  }: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    const qb = this.projectsRepository
      .createQueryBuilder("project")
      .leftJoinAndSelect("project.owner", "owner")
      .leftJoinAndSelect("project.collaborators", "collaborators")
      .leftJoinAndSelect("project.phases", "phases")
      .leftJoinAndSelect("phases.subPhases", "subPhases");

    if (search) {
      qb.andWhere(
        "(project.title ILIKE :search OR project.description ILIKE :search)",
        { search: `%${search}%` }
      );
    }

    if (status) {
      qb.andWhere("project.status = :status", { status });
    }

    qb.orderBy("project.created_at", "DESC")
      .skip((pageNum - 1) * limitNum)
      .take(limitNum);

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  /**
   * Get projects where the user is owner or collaborator
   */
  async findUserProjects(userId: string): Promise<Project[]> {
    return this.projectsRepository.find({
      where: [{ owner_id: userId }, { collaborators: { id: userId } }],
      relations: ["owner", "collaborators", "phases"],
      order: { updated_at: "DESC" },
    });
  }

  async findUserProjectsPaginated(
    userId: string,
    {
      page = 1,
      limit = 10,
      search,
      status,
    }: { page?: number; limit?: number; search?: string; status?: string }
  ) {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    const qb = this.projectsRepository
      .createQueryBuilder("project")
      .leftJoinAndSelect("project.owner", "owner")
      .leftJoinAndSelect("project.collaborators", "collaborators")
      .leftJoinAndSelect("project.phases", "phases")
      .leftJoinAndSelect("phases.subPhases", "subPhases")
      .leftJoin("project.collaborators", "collab")
      .where("project.owner_id = :userId", { userId })
      .orWhere("collab.id = :userId", { userId });

    if (search) {
      qb.andWhere(
        "(project.title ILIKE :search OR project.description ILIKE :search)",
        { search: `%${search}%` }
      );
    }

    if (status) {
      qb.andWhere("project.status = :status", { status });
    }

    qb.orderBy("project.created_at", "DESC")
      .skip((pageNum - 1) * limitNum)
      .take(limitNum);

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  async findOne(id: string, userId?: string): Promise<Project> {
    if (!id) {
      throw new BadRequestException("Project ID is required");
    }

    const project = await this.projectsRepository.findOne({
      where: { id },
      relations: ["owner", "collaborators", "phases", "phases.subPhases"],
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    // Check if user is contractor, sub_contractor, admin, or consultant - they can access all projects
    if (userId) {
      const user = await this.usersService.findOne(userId);
      const isContractor = user?.role === "contractor";
      const isSubContractor = user?.role === "sub_contractor";
      const isAdmin = user?.role === "admin";
      const isConsultant = user?.role === "consultant";

      if (
        !isContractor &&
        !isSubContractor &&
        !isAdmin &&
        !isConsultant &&
        !this.hasProjectAccess(project, userId)
      ) {
        throw new ForbiddenException("You don't have access to this project");
      }
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
    await this.dashboardService.updateStats();
    return this.findOne(savedProject.id);
  }

  async update(
    id: string,
    updateProjectDto: UpdateProjectDto,
    userId: string
  ): Promise<Project> {
    const project = await this.findOne(id);
    const user = await this.usersService.findOne(userId);
    const isAdmin = user?.role === "admin";
    const isConsultant = user?.role === "consultant";

    if (project.owner_id !== userId && !isAdmin && !isConsultant) {
      throw new ForbiddenException(
        "Only the project owner, admin, or consultant can update the project"
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
    await this.projectsRepository.save(project);
    await this.dashboardService.updateStats();
    return project;
  }

  async remove(id: string, userId: string): Promise<void> {
    const project = await this.findOne(id);
    const user = await this.usersService.findOne(userId);
    const isAdmin = user?.role === "admin";
    const isConsultant = user?.role === "consultant";

    if (project.owner_id !== userId && !isAdmin && !isConsultant) {
      throw new ForbiddenException(
        "Only the project owner, admin, or consultant can delete the project"
      );
    }

    await this.projectsRepository.remove(project);
    await this.dashboardService.updateStats();
  }

  async addCollaborator(
    projectId: string,
    collaborator: User,
    userId: string
  ): Promise<Project> {
    const project = await this.findOne(projectId);
    const user = await this.usersService.findOne(userId);
    const isAdmin = user?.role === "admin";
    const isConsultant = user?.role === "consultant";

    if (project.owner_id !== userId && !isAdmin && !isConsultant) {
      throw new ForbiddenException(
        "Only the project owner, admin, or consultant can add collaborators"
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
    const user = await this.usersService.findOne(userId);
    const isAdmin = user?.role === "admin";
    const isConsultant = user?.role === "consultant";

    if (project.owner_id !== userId && !isAdmin && !isConsultant) {
      throw new ForbiddenException(
        "Only the project owner, admin, or consultant can remove collaborators"
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
      // Use the new BOQ parser service with robust validation
      const parseResult = await this.boqParserService.parseBoqFile(file);
      
      console.log(`[BOQ Processing] Parser results:`, {
        itemsFound: parseResult.items.length,
        totalAmount: parseResult.totalAmount,
        sections: parseResult.sections,
        skipped: parseResult.metadata.skippedRows,
        fileType: parseResult.metadata.fileType,
      });
      
      return this.processBoqFileFromParsedData(
        projectId,
        parseResult.items, // Pass validated BOQ items
        parseResult.totalAmount,
        userId,
        file.originalname
      );
    } catch (error) {
      console.error("\n=== BOQ Processing Error ===");
      console.error("Error processing BOQ file:", error);

      // Check if phases were already created - if so, don't fail completely
      const existingPhases = await this.phasesRepository.find({
        where: { project_id: projectId },
      });

      if (existingPhases.length > 0) {
        console.warn(
          `Warning: Error occurred but ${existingPhases.length} phases were already created`
        );
        // Return success with the phases that were created
        return {
          message: `BOQ file processed with warnings. Created ${existingPhases.length} phases.`,
          totalAmount: (await this.findOne(projectId, userId)).totalAmount || 0,
          tasks: [],
        };
      }

      throw new BadRequestException(
        `Failed to process BOQ file: ${error.message}`
      );
    }
  }

  async processBoqFileFromParsedData(
    projectId: string,
    data: any[],
    totalAmount: number,
    userId: string,
    fileName?: string
  ): Promise<ProcessBoqResult> {
    // ✅ 1. Validate projectId BEFORE doing anything (MANDATORY)
    if (!projectId || projectId.trim() === '') {
      console.error('[ERROR] projectId is missing or empty in processBoqFileFromParsedData');
      throw new BadRequestException('Project ID is required to process BOQ file');
    }

    console.log(`[DEBUG] Processing BOQ - projectId: ${projectId}, userId: ${userId}`);

    // Verify project access and ensure project exists FIRST
    const project = await this.findOne(projectId, userId);
    
    // ✅ 2. Ensure project is created FIRST and has valid ID
    if (!project || !project.id) {
      console.error('[ERROR] Project not found or invalid:', { projectId, project });
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    console.log(
      `\nProcessing BOQ for Project: ${project.title} (ID: ${project.id})`
    );

    try {
      // Filter data to only include rows with BOTH Unit AND Quantity filled
      const dataWithUnits = data.filter((row) => {
        // Check if row has 'unit' property (from BOQ parser interface)
        if (row.unit && row.quantity) {
          const unit = (row.unit || "").toString().trim();
          const quantity = row.quantity;
          const hasUnit = unit && unit !== "" && unit !== "No";
          const hasQuantity = quantity && quantity > 0;
          return hasUnit && hasQuantity;
        }
        
        // Fallback: try to find unit and quantity columns using various methods
        const rowKeys = Object.keys(row);
        const unitCol = rowKeys.find((key) => {
          const normalized = normalizeColumnName(key);
          return normalized.includes('unit') || normalized.includes('unt');
        });
        const quantityCol = rowKeys.find((key) => {
          const normalized = normalizeColumnName(key);
          return normalized.includes('quantity') || normalized.includes('qty');
        });
        
        if (unitCol && quantityCol) {
          const unit = (row[unitCol] || "").toString().trim();
          const quantityStr = (row[quantityCol] || "").toString().trim();
          const hasUnit = unit && unit !== "";
          const hasQuantity = quantityStr && quantityStr !== "" && parseFloat(quantityStr) > 0;
          return hasUnit && hasQuantity;
        }
        return false;
      });

      console.log(`Filtered ${data.length} rows to ${dataWithUnits.length} rows with BOTH Unit and Quantity filled`);

      // ✅ Validate projectId before creating phases
      console.log(`[DEBUG processBoqFileFromParsedData] About to create phases - projectId: ${projectId}, project.id: ${project.id}`);
      if (!projectId || projectId !== project.id) {
        console.error(`[ERROR] projectId mismatch! projectId: ${projectId}, project.id: ${project.id}`);
        throw new BadRequestException('Project ID mismatch when creating phases');
      }

      // Create phases from BOQ data (only rows with Unit filled)
      const createdPhases = await this.createPhasesFromBoqData(
        dataWithUnits,
        projectId,
        userId
      );

      console.log(`[DEBUG] Created ${createdPhases.length} phases. Verifying all have project_id...`);
      // Verify all phases have project_id
      for (const phase of createdPhases) {
        if (!phase.project_id || phase.project_id !== projectId) {
          console.error(`[ERROR] Phase ${phase.id} has invalid project_id: ${phase.project_id}, expected: ${projectId}`);
          throw new Error(`Phase ${phase.id} was created without valid project_id`);
        }
      }

      // Update project with total amount
      // Reload project without relations to avoid TypeORM trying to update phases
      console.log(`[DEBUG] Reloading project ${project.id} without relations before saving...`);
      const projectToUpdate = await this.projectsRepository.findOne({
        where: { id: project.id },
      });
      
      if (!projectToUpdate) {
        throw new NotFoundException(`Project with ID ${project.id} not found`);
      }
      
      projectToUpdate.totalAmount = totalAmount;
      console.log(`[DEBUG] Saving project ${projectToUpdate.id} with totalAmount: ${totalAmount}`);
      await this.projectsRepository.save(projectToUpdate);
      console.log(`[DEBUG] Project saved successfully`);

      // Log activities
      try {
        await this.activitiesService.logBoqUploaded(
          project.owner,
          project,
          fileName || "BOQ File",
          createdPhases.length,
          totalAmount
        );
      } catch (error) {
        console.warn("Failed to log BOQ upload activity:", error);
      }

      console.log("\n=== BOQ Processing Complete ===");
      console.log(`BOQ data parsed: ${data.length} rows, Total Amount: ${totalAmount}`);
      console.log(`Created ${createdPhases.length} phases from rows with Unit column filled`);
      
      return {
        message: `Successfully processed BOQ file and created ${createdPhases.length} phases from rows with Unit column filled.`,
        totalAmount,
        tasks: [], // Keep for backward compatibility
      };
    } catch (error) {
      console.error("\n=== BOQ Processing Error ===");
      console.error("Error processing BOQ data:", error);

      throw new BadRequestException(
        `Failed to process BOQ data: ${error.message}`
      );
    }
  }

  async createPhase(
    projectId: string,
    createPhaseDto: CreatePhaseDto,
    userId: string
  ): Promise<Phase> {
    // ✅ 1. Validate projectId BEFORE doing anything (MANDATORY)
    if (!projectId || projectId.trim() === '') {
      console.error('[ERROR] projectId is missing or empty in createPhase');
      throw new BadRequestException('Project ID is required when creating a phase');
    }

    console.log(`[DEBUG] Creating phase - projectId: ${projectId}, userId: ${userId}`);

    // ✅ 2. Ensure project is created FIRST and verify access
    const project = await this.findOne(projectId, userId);
    
    if (!project || !project.id) {
      console.error('[ERROR] Project not found or invalid:', { projectId, project });
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }
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
    // ✅ 3. Validate projectId again before creating phase entity
    if (!projectId || projectId.trim() === '') {
      throw new BadRequestException('Project ID is required when creating a phase');
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
      project_id: projectId, // ✅ Ensure project_id is set
      subPhases: createPhaseDto.subPhases ?? [],
    };

    // ✅ 4. Debug the exact failure point
    console.log('[DEBUG] Phase data before save:', {
      projectId: phaseData.project_id,
      title: phaseData.title,
      hasProjectId: !!phaseData.project_id,
    });

    // ✅ 3. Fix TypeORM entity usage - set both project_id and project relation
    const phase = this.phasesRepository.create({
      ...phaseData,
      project: project, // Set the relation, not just project_id
    });

    // Final validation before save
    if (!phase.project_id) {
      console.error('[ERROR] Phase created without project_id:', phase);
      throw new BadRequestException('Phase must have a valid project_id');
    }

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
    return savedPhase;
  }

  async updatePhase(
    projectId: string,
    phaseId: string,
    updatePhaseDto: UpdatePhaseDto,
    userId: string
  ): Promise<Phase> {
    // ✅ 1. Validate projectId BEFORE doing anything (MANDATORY)
    if (!projectId || projectId.trim() === '') {
      console.error('[ERROR] projectId is missing or empty in updatePhase');
      throw new BadRequestException('Project ID is required when updating a phase');
    }

    console.log(`[DEBUG] Updating phase - projectId: ${projectId}, phaseId: ${phaseId}, userId: ${userId}`);

    // Project owner, contractors, and sub_contractors can update a phase
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
    
    if (!isOwner && !isContractor && !isSubContractor && !isAdmin && !isConsultant) {
      throw new ForbiddenException("Only the project owner, contractor, sub_contractor, admin, or consultant can update a phase");
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
      start_date: updatePhaseDto.startDate,
      end_date: updatePhaseDto.endDate,
      due_date: updatePhaseDto.dueDate,
      budget: updatePhaseDto.budget,
      progress: updatePhaseDto.progress,
      status: updatePhaseDto.status,
      parent_phase_id: updatePhaseDto.parentPhaseId || null,
      reference_task_id: updatePhaseDto.referenceTaskId || null,
    };
    // ✅ Ensure project_id is preserved when updating
    if (!phase.project_id) {
      console.error('[ERROR] Phase missing project_id during update:', phase);
      phase.project_id = projectId; // Set it from the validated projectId
    }

    // ✅ Debug before save
    console.log(`[DEBUG] Updating phase with project_id: ${phase.project_id}`);

    Object.assign(phase, updateData);
    
    // ✅ Final validation before save
    if (!phase.project_id || phase.project_id.trim() === '') {
      throw new BadRequestException('Phase must have a valid project_id');
    }

    const updatedPhase = await this.phasesRepository.save(phase);
    // Log activity for phase update
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
    return updatedPhase;
  }

  async deletePhase(
    projectId: string,
    phaseId: string,
    userId: string
  ): Promise<void> {
    // Project owner, contractors, and sub_contractors can delete a phase
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
    
    if (!isOwner && !isContractor && !isSubContractor && !isAdmin && !isConsultant) {
      throw new ForbiddenException("Only the project owner, contractor, sub_contractor, admin, or consultant can delete a phase");
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
    await this.activitiesService.createActivity(
      ActivityType.TASK_DELETED,
      `Phase "${phase.title}" was deleted`,
      user,
      project,
      phase,
      { phaseId: phase.id }
    );
  }

  async getProjectPhases(projectId: string, userId: string): Promise<Phase[]> {
    // Check if user is contractor or sub_contractor - they can access all projects
    const user = await this.usersService.findOne(userId);
    const isContractor = user?.role === "contractor";
    const isSubContractor = user?.role === "sub_contractor";

    // Verify project access (skip for contractors and sub_contractors)
    if (!isContractor && !isSubContractor) {
      await this.findOne(projectId, userId);
    } else {
      // For contractors and sub_contractors, just verify project exists
      const project = await this.projectsRepository.findOne({
        where: { id: projectId },
      });
      if (!project) {
        throw new NotFoundException(`Project with ID ${projectId} not found`);
      }
    }

    // Only return active phases (excludes BOQ draft phases)
    return this.phasesRepository.find({
      where: { project_id: projectId, is_active: true },
      relations: ["subPhases", "subPhases.subPhases"],
      order: { created_at: "ASC" },
    });
  }

  async getProjectPhasesPaginated(
    projectId: string,
    userId: string,
    { page = 1, limit = 10 }: { page?: number; limit?: number }
  ) {
    // Check if user is contractor or sub_contractor - they can access all projects
    const user = await this.usersService.findOne(userId);
    const isContractor = user?.role === "contractor";
    const isSubContractor = user?.role === "sub_contractor";

    // Verify project access (skip for contractors and sub_contractors)
    if (!isContractor && !isSubContractor) {
      await this.findOne(projectId, userId);
    } else {
      // For contractors and sub_contractors, just verify project exists
      const project = await this.projectsRepository.findOne({
        where: { id: projectId },
      });
      if (!project) {
        throw new NotFoundException(`Project with ID ${projectId} not found`);
      }
    }

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    // Only return active phases (excludes BOQ draft phases)
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
    // Calculate progress the same way as ContractorProjectDetails
    const calculatePhaseCompletion = (phase: Phase): number => {
      if (!phase.subPhases || phase.subPhases.length === 0) {
        return phase.progress || 0;
      }
      const completed = phase.subPhases.filter((sp) => sp.isCompleted).length;
      return Math.round((completed / phase.subPhases.length) * 100);
    };

    const phases = project.phases || [];
    const projectProgress =
      phases.length > 0
        ? Math.round(
            phases.reduce((sum, p) => sum + calculatePhaseCompletion(p), 0) /
              phases.length
          )
        : 0;

    const completedPhases = phases.filter(
      (p) => p.status === "completed"
    ).length;
    const totalPhases = phases.length;

    return {
      id: project.id,
      name: project.title,
      description: project.description,
      progress: projectProgress,
      completedPhases,
      totalPhases,
      totalAmount: project.totalAmount,
      startDate: project.start_date,
      estimatedCompletion: project.end_date,
      owner: project.owner?.display_name || project.owner_id,
      collaborators: (project.collaborators || []).map(
        (c) => c.display_name || c.id
      ),
      tags: project.tags,
      phases: phases.map((phase) => ({
        id: phase.id,
        name: phase.title,
        title: phase.title,
        status: phase.status,
        progress: calculatePhaseCompletion(phase),
        startDate: phase.start_date,
        start_date: phase.start_date,
        endDate: phase.end_date,
        end_date: phase.end_date,
        subPhases: (phase.subPhases || []).map((sub) => ({
          id: sub.id,
          title: sub.title,
          description: sub.description,
          isCompleted: sub.isCompleted,
        })),
      })),
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
    const user = await this.usersService.findOne(ownerId);
    const isAdmin = user?.role === "admin";
    const isConsultant = user?.role === "consultant";
    if (project.owner_id !== ownerId && !isAdmin && !isConsultant)
      throw new ForbiddenException("Only the owner, admin, or consultant can view join requests");
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
    const user = await this.usersService.findOne(ownerId);
    const isAdmin = user?.role === "admin";
    const isConsultant = user?.role === "consultant";
    if (project.owner_id !== ownerId && !isAdmin && !isConsultant)
      throw new ForbiddenException("Only the owner, admin, or consultant can approve join requests");
    const request = await this.accessRequestRepository.findOne({
      where: { id: requestId, project_id: projectId },
    });
    if (!request) throw new NotFoundException("Join request not found");
    if (request.status !== "pending")
      throw new BadRequestException("Request is not pending");
    // Add user as collaborator
    const requesterUser = await this.usersService.findOne(request.requester_id);
    if (!project.collaborators.some((c) => c.id === requesterUser.id)) {
      project.collaborators.push(requesterUser);
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
    const user = await this.usersService.findOne(ownerId);
    const isAdmin = user?.role === "admin";
    const isConsultant = user?.role === "consultant";
    if (project.owner_id !== ownerId && !isAdmin && !isConsultant)
      throw new ForbiddenException("Only the owner, admin, or consultant can deny join requests");
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

  async countAll(): Promise<number> {
    return this.projectsRepository.count();
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
    const qb = this.projectsRepository
      .createQueryBuilder("project")
      .select(`to_char(project.created_at, '${groupFormat}')`, "period")
      .addSelect("COUNT(*)", "count");
    if (startDate)
      qb.andWhere("project.created_at >= :startDate", { startDate });
    if (endDate) qb.andWhere("project.created_at <= :endDate", { endDate });
    qb.groupBy("period").orderBy("period", "ASC");
    return qb.getRawMany();
  }

  async adminList({ search = "", status, page = 1, limit = 10 }) {
    // Ensure page and limit are numbers
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    const qb = this.projectsRepository
      .createQueryBuilder("project")
      .leftJoinAndSelect("project.owner", "owner")
      .leftJoinAndSelect("project.collaborators", "collaborators")
      .leftJoinAndSelect("project.phases", "phases");
    if (search) {
      qb.andWhere(
        "project.title ILIKE :search OR project.description ILIKE :search",
        { search: `%${search}%` }
      );
    }
    if (status) {
      qb.andWhere("project.status = :status", { status });
    }
    qb.orderBy("project.created_at", "DESC")
      .skip((pageNum - 1) * limitNum)
      .take(limitNum);
    const [items, total] = await qb.getManyAndCount();
    const totalPages = Math.ceil(total / limitNum);
    
    return {
      items: items.map((p) => {
        const phases = p.phases || [];
        const completedPhases = phases.filter((phase) => phase.status === "completed").length;
        const totalPhases = phases.length;
        const progress = totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 100) : 0;
        const totalBudget = phases.reduce((sum, phase) => sum + (phase.budget || 0), 0);
        
        return {
          id: p.id,
          name: p.title,
          description: p.description,
          status: p.status,
          createdAt: p.created_at,
          updatedAt: p.updated_at,
          owner: p.owner
            ? { id: p.owner.id, display_name: p.owner.display_name }
            : null,
          members: (p.collaborators || []).map((c) => ({
            id: c.id,
            display_name: c.display_name,
          })),
          tags: p.tags,
          progress,
          completedPhases,
          totalPhases,
          totalAmount: p.totalAmount || 0,
          totalBudget: totalBudget || p.totalBudget || 0,
          startDate: p.start_date || p.created_at,
          estimatedCompletion: p.end_date || p.updated_at,
        };
      }),
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
    };
  }

  async findAllForAdmin() {
    return this.projectsRepository.find({
      relations: ["owner", "collaborators", "phases"],
      order: { created_at: "DESC" },
    });
  }

  async adminGetDetails(id: string) {
    const project = await this.projectsRepository.findOne({
      where: { id },
      relations: ["owner", "collaborators", "phases", "phases.subPhases"],
    });
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    // Use the same getProjectResponse method to ensure consistent format
    return await this.getProjectResponse(project);
  }

  async getTopActiveProjects(limit: number = 5) {
    // Placeholder: sort by created_at desc, replace with real activity metric if available
    const projects = await this.projectsRepository.find({
      order: { created_at: "DESC" },
      take: limit,
      relations: ["owner", "collaborators"],
    });
    return projects.map((p) => ({
      id: p.id,
      name: p.title,
      description: p.description,
      status: p.status,
      createdAt: p.created_at,
      owner: p.owner
        ? { id: p.owner.id, display_name: p.owner.display_name }
        : null,
      members: (p.collaborators || []).map((c) => ({
        id: c.id,
        display_name: c.display_name,
      })),
      // add more fields as needed
    }));
  }

  async getGroupedByStatus() {
    const results = await this.projectsRepository
      .createQueryBuilder("project")
      .select("project.status", "status")
      .addSelect("COUNT(*)", "count")
      .groupBy("project.status")
      .getRawMany();

    const total = results.reduce(
      (sum, result) => sum + parseInt(result.count),
      0
    );

    return results.map((result) => ({
      status: result.status,
      count: parseInt(result.count),
      percentage: total > 0 ? (parseInt(result.count) / total) * 100 : 0,
    }));
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

    const str = value.toString().trim();
    // Handle empty values like " - ", "-", or empty strings
    if (
      str === "" ||
      str === "-" ||
      str === " - " ||
      str.toLowerCase() === "n/a"
    ) {
      return 0;
    }

    const numStr = str.replace(/[^0-9.-]+/g, "");
    const parsed = Number(numStr);
    return isNaN(parsed) ? 0 : parsed;
  }

  private async parseBoqFile(file: Express.Multer.File): Promise<{
    data: any[];
    totalAmount: number;
  }> {
    console.log("[DEBUG] Reading CSV file buffer...");
    
    // Parse CSV file - read ALL lines including empty ones for processing
    const csvContent = file.buffer.toString("utf-8");
    // Handle different line endings (Windows \r\n, Unix \n, Mac \r)
    const allLines = csvContent.split(/\r?\n/);
    
    if (allLines.length === 0) {
      throw new BadRequestException("CSV file is empty");
    }
    
    console.log(`[DEBUG] Total lines in CSV: ${allLines.length}`);
    
    // Filter out completely empty lines (but keep lines with just whitespace for now)
    const lines = allLines.filter((line) => line.trim().length > 0 || line.includes(','));
    
    console.log(`[DEBUG] Non-empty lines: ${lines.length}`);

    // Parse header row
    const headerLine = lines[0];
    const rawHeaders = this.parseCsvLine(headerLine).map((h) => h.trim());
    
    // Bilingual cleanup: Separate Chinese translations into dedicated columns
    const headers: string[] = [];
    const chineseTranslationColumns: Record<number, string> = {};
    
    rawHeaders.forEach((header, index) => {
      // Check if header contains Chinese characters
      const hasChinese = /[\u4e00-\u9fff]/.test(header);
      const hasEnglish = /[a-zA-Z]/.test(header);
      
      if (hasChinese && hasEnglish) {
        // Split bilingual header
        const englishPart = header.replace(/[\u4e00-\u9fff]/g, '').trim();
        const chinesePart = header.replace(/[a-zA-Z0-9\s]/g, '').trim();
        
        if (englishPart) {
          headers.push(englishPart);
          if (chinesePart) {
            chineseTranslationColumns[index] = chinesePart;
          }
        } else {
          headers.push(header);
        }
      } else {
        headers.push(header);
      }
    });
    
    // Parse data rows with enhanced processing - process EVERY row
    const rawData = lines.slice(1).map((line, lineIndex) => {
      try {
        const values = this.parseCsvLine(line);
        const row: any = { _originalLineIndex: lineIndex + 2 }; // +2 because we skip header and 0-indexed
        headers.forEach((header, index) => {
          const value = values[index]?.trim() || "";
          // Store Chinese translation if available
          if (chineseTranslationColumns[index]) {
            row[`${header}_chinese`] = value;
          }
          row[header] = value;
        });
        return row;
      } catch (error) {
        console.warn(`[DEBUG] Error parsing line ${lineIndex + 2}: ${error.message}`);
        // Return a row with error flag instead of skipping
        return { _parseError: true, _originalLineIndex: lineIndex + 2 };
      }
    }).filter((row) => !row._parseError); // Only filter out rows with parse errors
    
    console.log(`[DEBUG] Successfully parsed ${rawData.length} rows from ${lines.length - 1} data lines`);
    
    // Enhanced filtering: Only remove clearly invalid rows (totals, instructional text)
    // Keep all rows that have any meaningful data
    const columnMappings = this.getColumnMappingsFromHeaders(headers);
    const descriptionCol = columnMappings.descriptionCol;
    const quantityCol = columnMappings.quantityCol;
    const priceCol = columnMappings.priceCol;
    
    const filteredData = rawData.filter((row, index) => {
      // Check if row has ANY meaningful content (not just description)
      const hasAnyContent = Object.entries(row).some(([key, val]) => {
        // Skip internal fields
        if (key.startsWith('_')) return false;
        const str = val?.toString().trim() || "";
        return str.length > 0 && str !== "-" && str !== "—" && str !== "N/A";
      });
      
      if (!hasAnyContent) {
        console.log(`[DEBUG] Filtered out empty row at line ${row._originalLineIndex}`);
        return false;
      }
      
      // Only filter based on description if it exists
      if (descriptionCol && row[descriptionCol]) {
        const desc = (row[descriptionCol] || "").toString().toLowerCase().trim();
        
        // Only filter out CLEARLY invalid rows (totals, notes, instructions)
        // Be more lenient - only exclude if description is clearly a summary/instruction
        const isClearlyInvalid = 
          (desc === "total" || desc === "sum" || desc === "subtotal" || desc === "grand total") ||
          (desc.startsWith("note:") || desc.startsWith("注意:")) ||
          (desc.startsWith("instruction") || desc.startsWith("说明")) ||
          (desc.includes("合计") && desc.length < 10) || // Short Chinese total
          (desc.includes("总计") && desc.length < 10); // Short Chinese grand total
        
        if (isClearlyInvalid) {
          console.log(`[DEBUG] Filtered out invalid row: "${desc}" at line ${row._originalLineIndex}`);
          return false;
        }
      }
      
      // If row has quantity or price, it's likely valid even without description
      if (!descriptionCol || !row[descriptionCol] || row[descriptionCol].trim() === "") {
        // Check if row has quantity or price - if so, keep it
        const hasQuantity = quantityCol && row[quantityCol] && row[quantityCol].toString().trim() !== "";
        const hasPrice = priceCol && row[priceCol] && row[priceCol].toString().trim() !== "";
        
        if (hasQuantity || hasPrice) {
          // Row has numeric data, keep it even without description
          console.log(`[DEBUG] Keeping row without description but with quantity/price at line ${row._originalLineIndex}`);
          return true;
        }
      }
      
      return true; // Keep all other rows
    });
    
    console.log(`[DEBUG] After filtering: ${filteredData.length} rows (from ${rawData.length} parsed rows)`);
    
    // Hierarchical Structure Detection: Identify Main Sections and Sub Sections
    const processedData = this.detectHierarchicalStructure(filteredData, headers);
    
    // Standardize numerical formatting
    const standardizedData = processedData.map((row) => {
      const standardizedRow = { ...row };
      
      // Standardize quantities, rates, and totals
      // Reuse columnMappings from earlier in the function
      
      // Find total price column
      let totalPriceCol: string | undefined;
      for (const col of headers) {
        const normalized = normalizeColumnName(col);
        if (
          normalized.includes("total") &&
          (normalized.includes("price") || normalized.includes("amount"))
        ) {
          totalPriceCol = col;
          break;
        }
      }
      
      // Standardize quantity
      if (quantityCol && row[quantityCol]) {
        standardizedRow[quantityCol] = this.standardizeNumber(row[quantityCol]);
      }
      
      // Standardize price/rate
      if (priceCol && row[priceCol]) {
        standardizedRow[priceCol] = this.standardizeNumber(row[priceCol]);
      }
      
      // Standardize total price/amount
      if (totalPriceCol && row[totalPriceCol]) {
        standardizedRow[totalPriceCol] = this.standardizeNumber(row[totalPriceCol]);
      }
      
      return standardizedRow;
    });
    
    console.log(`[DEBUG] Parsed ${standardizedData.length} rows from CSV file (filtered from ${rawData.length} raw rows)`);
    console.log(`[DEBUG] Row processing summary:`);
    console.log(`  - Total lines in file: ${allLines.length}`);
    console.log(`  - Non-empty lines: ${lines.length}`);
    console.log(`  - Header row: 1`);
    console.log(`  - Data rows parsed: ${rawData.length}`);
    console.log(`  - Rows after filtering: ${filteredData.length}`);
    console.log(`  - Rows after hierarchical detection: ${processedData.length}`);
    console.log(`  - Rows after standardization: ${standardizedData.length}`);

    // Column mappings already defined above - reuse them
    // const columnMappings, descriptionCol, quantityCol, priceCol are already available

    // Find TOTAL PRICE column
    let totalPriceCol: string | undefined;
    for (const col of headers) {
      if (typeof col === "string") {
        const normalized = normalizeColumnName(col);
        if (
          normalized.includes("total") &&
          (normalized.includes("price") || normalized.includes("amount"))
        ) {
          totalPriceCol = col;
          break;
        }
      }
    }

    // Filter valid data rows for phase creation
    // Only exclude main sections (which are organizational headers, not actual work items)
    // Keep all other rows that have content
    const validData = standardizedData.filter((row) => {
      // Exclude main sections (organizational headers) from phase creation
      // But keep sub-sections and regular items
      if (row.isMainSection) {
        console.log(`[DEBUG] Excluding main section from phases: "${row[descriptionCol]}"`);
        return false;
      }
      
      // Include all other rows - even if description is empty, if they have quantity/price
      const desc = row[descriptionCol];
      const hasDescription = desc && typeof desc === "string" && desc.trim() !== "";
      
      // Check if row has quantity or price data
      const hasQuantity = quantityCol && row[quantityCol] && this.parseAmount(row[quantityCol]) > 0;
      const hasPrice = priceCol && row[priceCol] && this.parseAmount(row[priceCol]) > 0;
      
      // Include if has description OR has quantity/price data
      if (hasDescription || hasQuantity || hasPrice) {
        return true;
      }
      
      // Log rows that are being excluded
      console.log(`[DEBUG] Excluding row without description or quantity/price at line ${row._originalLineIndex || 'unknown'}`);
      return false;
    });
    
    console.log(`[DEBUG] Valid data rows for phase creation: ${validData.length} (from ${standardizedData.length} standardized rows)`);

    // Calculate total amount
    let totalAmount = 0;
    if (totalPriceCol) {
      // Sum all TOTAL PRICE values from valid rows
      totalAmount = validData.reduce((sum, row) => {
        const amount = this.parseAmount(row[totalPriceCol]) || 0;
        return sum + amount;
      }, 0);
      console.log(
        `Calculated total amount from TOTAL PRICE column: ${totalAmount}`
      );
    } else {
      // Fallback: calculate from individual rows using TOTAL PRICE or quantity * price
        totalAmount = validData.reduce((sum, row) => {
          let amount = 0;
          if (totalPriceCol && row[totalPriceCol]) {
            amount = this.parseAmount(row[totalPriceCol]) || 0;
          } else {
            const qty = this.parseAmount(row[quantityCol]) || 0;
            const price = this.parseAmount(row[priceCol]) || 0;
            amount = qty * price;
          }
          return sum + amount;
        }, 0);
        console.log(
          `Calculated total amount from individual rows: ${totalAmount}`
        );
    }

    return { data: validData, totalAmount };
  }

  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i++;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    
    // Add the last field
    result.push(current);
    
    return result;
  }

  /**
   * Detect hierarchical structure: Main Sections and Sub Sections
   */
  private detectHierarchicalStructure(data: any[], headers: string[]): any[] {
    const columnMappings = this.getColumnMappingsFromHeaders(headers);
    const descriptionCol = columnMappings.descriptionCol;
    const quantityCol = columnMappings.quantityCol;
    const priceCol = columnMappings.priceCol;
    
    if (!descriptionCol) return data;
    
    let currentMainSection: string | null = null;
    let currentSubSection: string | null = null;
    
    return data.map((row, index) => {
      const description = (row[descriptionCol] || "").toString().trim();
      
      // Detect Main Sections (organizational headers, not actual work items)
      // Main sections are usually:
      // - Very short (less than 30 chars)
      // - All caps OR start with numbers like "1.", "2.", etc.
      // - Have NO quantity AND NO price (definitely not a work item)
      // - Are clearly headers, not actual line items
      const hasQuantity = quantityCol && row[quantityCol] && this.parseAmount(row[quantityCol]) > 0;
      const hasPrice = priceCol && row[priceCol] && this.parseAmount(row[priceCol]) > 0;
      
      // NEVER mark rows with quantity or price as main sections
      if (hasQuantity || hasPrice) {
        row.isMainSection = false;
        row.mainSection = currentMainSection;
      } else {
        // Only consider as main section if it's clearly a header
        const isAllCaps = description === description.toUpperCase() && description.length < 30;
        const startsWithNumber = /^\d+[\.\)]\s*[A-Z]/.test(description); // Number followed by capital letter
        const isVeryShort = description.length < 30;
        
        // Only mark as main section if it's clearly a header pattern AND has no data
        if ((isAllCaps || startsWithNumber) && isVeryShort && description.length > 0) {
          currentMainSection = description;
          currentSubSection = null;
          row.isMainSection = true;
          row.mainSection = description;
          console.log(`[DEBUG] Detected main section: "${description}"`);
        } else {
          row.isMainSection = false;
          row.mainSection = currentMainSection;
        }
      }
      
      // Detect Sub Sections (indented or prefixed items) - only for non-main-section rows
      if (!row.isMainSection) {
        // Sub sections typically:
        // - Start with lowercase or have indentation markers
        // - Are part of a main section
        // - May have sub-numbering like "1.1", "1.2"
        const hasSubNumbering = /^\d+\.\d+/.test(description);
        const startsWithLowercase = /^[a-z]/.test(description.trim());
        const hasNoQuantity = !quantityCol || !row[quantityCol] || row[quantityCol] === "";
        const hasNoPrice = !priceCol || !row[priceCol] || row[priceCol] === "";
        
        if (currentMainSection && (hasSubNumbering || startsWithLowercase)) {
          // Check if this might be a sub-section header (no quantity/price)
          if (hasNoQuantity && hasNoPrice) {
            currentSubSection = description;
            row.isSubSection = true;
            row.subSection = description;
          } else {
            row.isSubSection = false;
            row.subSection = currentSubSection;
          }
        } else {
          row.isSubSection = false;
          row.subSection = currentSubSection;
        }
      } else {
        // Main sections don't have sub-sections
        row.isSubSection = false;
        row.subSection = null;
      }
      
      return row;
    });
  }

  /**
   * Standardize number formatting: Remove commas, currency symbols, and convert to number
   */
  private standardizeNumber(value: any): number {
    if (value === null || value === undefined || value === "") return 0;
    
    const str = String(value).trim();
    if (str === "" || str === "-" || str === "—" || str === "N/A") return 0;
    
    // Remove currency symbols, commas, and other non-numeric characters (except decimal point and minus)
    const cleaned = str
      .replace(/[^\d.-]/g, '') // Remove all non-numeric except . and -
      .replace(/,/g, ''); // Remove commas
    
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }

  private getColumnMappingsFromHeaders(headers: string[]) {
    const normalizedMap: Record<string, string> = {};
    for (const col of headers) {
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

  /**
   * STEP 4 & 5: Create phases from validated BOQ items
   * - Map clean rows to phases
   * - Add safety net: never allow phase creation without projectId
   * - Fail fast if any phase is missing projectId
   */
  private async createPhasesFromBoqData(
    data: any[],
    projectId: string,
    userId: string
  ): Promise<Phase[]> {
    // STEP 5: Validate projectId BEFORE doing anything (MANDATORY - FAIL FAST)
    if (!projectId || projectId.trim() === '') {
      const error = '❌ CRITICAL: Project ID is required when creating phases from BOQ data';
      console.error(`[Phase Creation] ${error}`);
      throw new Error(error);
    }

    console.log(`[Phase Creation] Starting - projectId: ${projectId}, BOQ items: ${data.length}`);
    
    if (!data || data.length === 0) {
      console.log("[Phase Creation] No BOQ data to create phases from");
      return [];
    }

    // Get project for dates
    const project = await this.findOne(projectId, userId);
    if (!project) {
      throw new Error(`Project with ID ${projectId} not found`);
    }

    const projectStartDate = project.start_date ? new Date(project.start_date) : new Date();
    const projectEndDate = project.end_date ? new Date(project.end_date) : new Date();
    const totalDays = Math.max(
      1,
      Math.ceil((projectEndDate.getTime() - projectStartDate.getTime()) / (1000 * 60 * 60 * 24))
    );

    const phases: Phase[] = [];
    const daysPerPhase = totalDays / Math.max(data.length, 1);

    console.log(`[Phase Creation] Creating ${data.length} phases from BOQ items`);

    // STEP 4: Map clean rows → phases
    for (let i = 0; i < data.length; i++) {
      const item = data[i];

      // Calculate phase dates
      const phaseStartDate = new Date(projectStartDate);
      phaseStartDate.setDate(phaseStartDate.getDate() + i * daysPerPhase);
      const phaseEndDate = new Date(phaseStartDate);
      phaseEndDate.setDate(phaseEndDate.getDate() + daysPerPhase);

      // Build phase description with metadata
      const phaseDescription = [
        item.section ? `Section: ${item.section}` : null,
        `Unit: ${item.unit}`,
        `Quantity: ${item.quantity}`,
        item.rate > 0 ? `Rate: ${item.rate}` : null,
      ].filter(Boolean).join(' | ');

      // STEP 4: Create phase object
      // ⚠️ IMPORTANT: BOQ phases are created as INACTIVE (is_active = false)
      // User must explicitly activate them from the BOQ phases list
      const phaseData = {
        title: item.description, // Title = Description from BOQ
        description: phaseDescription, // Additional metadata
        budget: item.amount || 0,
        start_date: phaseStartDate,
        end_date: phaseEndDate,
        due_date: phaseEndDate,
        progress: 0,
        status: PhaseStatus.NOT_STARTED,
        project_id: projectId, // ✅ CRITICAL: Always set project_id
        is_active: false, // 🔒 HIDDEN: User must activate these phases
        from_boq: true, // 📋 Mark as BOQ-created
      };

      // STEP 5: Safety net - verify projectId before INSERT
      if (!phaseData.project_id || phaseData.project_id.trim() === '') {
        const error = `❌ CRITICAL: Phase "${item.description}" has no projectId`;
        console.error(`[Phase Creation] ${error}`);
        throw new Error(error);
      }

      console.log(`[Phase Creation] Creating phase ${i + 1}/${data.length}: "${item.description.substring(0, 50)}..."`);

      // Insert phase using raw query to avoid TypeORM relation issues
      const insertQuery = `
        INSERT INTO phase (
          title, description, budget, start_date, end_date, due_date, 
          progress, status, project_id, is_active, from_boq, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        ) RETURNING *
      `;

      try {
        const result = await this.phasesRepository.query(insertQuery, [
          phaseData.title,
          phaseData.description,
          phaseData.budget,
          phaseData.start_date,
          phaseData.end_date,
          phaseData.due_date,
          phaseData.progress,
          phaseData.status,
          phaseData.project_id,
          phaseData.is_active,
          phaseData.from_boq,
        ]);

        if (!result || result.length === 0) {
          throw new Error(`Failed to create phase: ${item.description}`);
        }

        // Fetch the created phase
        const savedPhase = await this.phasesRepository.findOne({
          where: { id: result[0].id },
          relations: ['project'],
        });

        if (!savedPhase) {
          throw new Error(`Failed to retrieve created phase: ${item.description}`);
        }

        // STEP 5: Final verification - ensure phase has correct project_id
        if (savedPhase.project_id !== projectId) {
          const error = `❌ CRITICAL: Phase "${savedPhase.title}" has incorrect project_id: ${savedPhase.project_id}, expected: ${projectId}`;
          console.error(`[Phase Creation] ${error}`);
          throw new Error(error);
        }

        phases.push(savedPhase);

        console.log(
          `[Phase Creation] ✅ Created phase ${i + 1}: "${item.description.substring(0, 40)}" | Budget: ${item.amount} | Qty: ${item.quantity} ${item.unit}`
        );
      } catch (error) {
        console.error(`[Phase Creation] ❌ Failed to create phase "${item.description}":`, error);
        throw error;
      }
    }

    // STEP 5: Final safety net - verify ALL phases have correct project_id
    console.log(`[Phase Creation] Verifying all ${phases.length} phases...`);
    for (const phase of phases) {
      if (!phase.project_id || phase.project_id !== projectId) {
        const error = `❌ CRITICAL: Phase "${phase.title}" (${phase.id}) has incorrect project_id: ${phase.project_id}, expected: ${projectId}`;
        console.error(`[Phase Creation] ${error}`);
        throw new Error(error);
      }
    }

    console.log(`[Phase Creation] ✅ Successfully created ${phases.length} phases for project ${projectId}`);
    return phases;
  }

  // Keep the old complex implementation as a backup (can be removed later)
  private async createPhasesFromBoqData_OLD(
    data: any[],
    projectId: string,
    userId: string
  ): Promise<Phase[]> {
    // Old implementation preserved for reference
    // Can be removed after testing new implementation

    // Get column mappings from the first row keys (CSV headers)
    const rowKeys = data.length > 0 ? Object.keys(data[0]) : [];
    const columnMappings = this.getColumnMappingsFromHeaders(rowKeys);
    let { descriptionCol, unitCol, quantityCol, priceCol } = columnMappings;
    
    // Log column mappings for debugging
    console.log(`[DEBUG createPhasesFromBoqData] Column mappings:`, {
      descriptionCol,
      unitCol,
      quantityCol,
      priceCol,
      availableKeys: rowKeys,
      sampleRow: data.length > 0 ? Object.keys(data[0]).reduce((acc, key) => {
        acc[key] = String(data[0][key]).substring(0, 50); // First 50 chars
        return acc;
      }, {} as Record<string, string>) : null
    });
    
    // If description column not found, try to find it manually by checking actual data
    if (!descriptionCol && data.length > 0) {
      // Check first few rows to find which column has the longest text (likely description)
      const firstFewRows = data.slice(0, Math.min(5, data.length));
      const columnLengths: Record<string, number> = {};
      
      rowKeys.forEach(key => {
        let totalLength = 0;
        firstFewRows.forEach(row => {
          const value = String(row[key] || "").trim();
          totalLength += value.length;
        });
        columnLengths[key] = totalLength;
      });
      
      // Find column with longest average text (likely description)
      const longestCol = Object.entries(columnLengths)
        .sort((a, b) => b[1] - a[1])
        .find(([key]) => {
          const keyLower = key.toLowerCase();
          return !keyLower.includes('qty') && 
                 !keyLower.includes('quantity') &&
                 !keyLower.includes('unit') &&
                 !keyLower.includes('price') &&
                 !keyLower.includes('amount') &&
                 !keyLower.includes('total');
        });
      
      if (longestCol && longestCol[1] > 10) {
        descriptionCol = longestCol[0];
        console.log(`[DEBUG] Auto-detected description column: ${descriptionCol} (avg length: ${longestCol[1] / firstFewRows.length})`);
      }
    }

    // Find TOTAL PRICE column from the first row
    let totalPriceCol: string | undefined;
    if (data.length > 0) {
      totalPriceCol = rowKeys.find((key) => {
        const normalized = normalizeColumnName(key);
        return (
          normalized.includes("total") &&
          (normalized.includes("price") || normalized.includes("amount"))
        );
      });
    }

    const phases: Phase[] = [];
    console.log(`Creating phases from ${data.length} BOQ data rows`);

    // Get project dates for phase date calculation
    const project = await this.findOne(projectId, userId);

    // Validate projectId is not undefined
    if (!projectId) {
      throw new Error("Project ID is required to create phases");
    }

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

    // Group rows that have both QTY and UNT filled as one phase
    // Also include rows with just unit (EA, Rolls, Sets, etc.) or just description
    const groupedRows: any[][] = [];
    let currentGroup: any[] = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const description = (row[descriptionCol] || "").toString().trim();
      const unit = unitCol ? (row[unitCol] || "").toString().trim() : "";
      const quantity = this.parseAmount(quantityCol ? row[quantityCol] : undefined) || 0;
      const price = this.parseAmount(priceCol ? row[priceCol] : undefined) || 0;
      const totalPrice = totalPriceCol ? this.parseAmount(row[totalPriceCol]) || 0 : 0;
      
      // ✅ REQUIREMENT: Only include rows that have Unit column filled
      // Skip rows without unit
      if (!unit || unit.trim() === "") {
        // If we have a group, finalize it before skipping
        if (currentGroup.length > 0) {
          groupedRows.push([...currentGroup]);
          currentGroup = [];
        }
        continue;
      }

      // Check if row has both quantity and unit filled
      const hasQuantityAndUnit = quantity > 0 && unit && unit.trim() !== "";
      
      // Check if row has unit but no quantity (EA, Rolls, Sets, etc.)
      const hasUnitOnly = !hasQuantityAndUnit && unit && unit.trim() !== "" && description && description.trim() !== "";
      
      // Check if this is a section header (no quantity/unit/price, but has description)
      // Note: Section headers should already be filtered out by unit check above, but keep for safety
      const isSectionHeader = !hasQuantityAndUnit && !hasUnitOnly && !price && !totalPrice && description && description.trim() !== "";

      // Skip section headers (shouldn't happen if unit is required, but keep for safety)
      if (isSectionHeader) {
        // If we have a group, finalize it before skipping header
        if (currentGroup.length > 0) {
          groupedRows.push([...currentGroup]);
          currentGroup = [];
        }
        continue;
      }

      // Include rows with unit filled (required) - either with quantity or without
      if (hasQuantityAndUnit || hasUnitOnly) {
        // Check if this row should start a new group
        // Group rows with same unit together, or if unit changes, start new group
        if (currentGroup.length > 0) {
          const lastRow = currentGroup[currentGroup.length - 1];
          const lastUnit = unitCol ? (lastRow[unitCol] || "").toString().trim() : "";
          const lastHasQuantity = this.parseAmount(quantityCol ? lastRow[quantityCol] : undefined) || 0;
          
          // If unit changes or if previous row had quantity+unit and this one doesn't, start new group
          if ((lastUnit && unit && lastUnit !== unit) || 
              (lastHasQuantity > 0 && quantity === 0 && unit)) {
            groupedRows.push([...currentGroup]);
            currentGroup = [row];
          } else {
            // Add to current group
            currentGroup.push(row);
          }
        } else {
          // Start new group
          currentGroup.push(row);
        }
      } else {
        // If we have a group, finalize it
        if (currentGroup.length > 0) {
          groupedRows.push([...currentGroup]);
          currentGroup = [];
        }
        // Note: We no longer include rows without unit, so this else block should rarely execute
        // But if it does, we skip the row since it doesn't have a unit
      }
    }

    // Don't forget the last group
    if (currentGroup.length > 0) {
      groupedRows.push(currentGroup);
    }

    console.log(`Grouped ${data.length} rows into ${groupedRows.length} phases`);
    console.log(`Column mappings: descriptionCol=${descriptionCol}, unitCol=${unitCol}, quantityCol=${quantityCol}, priceCol=${priceCol}`);
    
    // Log sample of grouped rows for debugging
    if (groupedRows.length > 0) {
      console.log(`Sample first group (${groupedRows[0].length} rows):`, 
        groupedRows[0].map((r, idx) => ({
          idx,
          desc: r[descriptionCol] || 'NO DESC',
          unit: r[unitCol] || 'NO UNIT',
          qty: r[quantityCol] || 'NO QTY'
        }))
      );
    }

    const daysPerPhase = totalDays / Math.max(groupedRows.length, 1);

    for (let groupIndex = 0; groupIndex < groupedRows.length; groupIndex++) {
      const group = groupedRows[groupIndex];
      
      // Combine data from all rows in the group
      let combinedDescription = "";
      let combinedUnit = "";
      let totalQuantity = 0;
      let totalAmount = 0;
      const descriptions: string[] = [];
      const units = new Set<string>();

      for (const row of group) {
        // Try multiple ways to get description - handle different column name variations
        let description = "";
        
        // First priority: use the explicitly extracted description if available
        if (row._extractedDescription && row._extractedDescription.trim() !== "") {
          description = row._extractedDescription.toString().trim();
          console.log(`[DEBUG] Using extracted description: "${description.substring(0, 50)}"`);
        }
        // Second priority: use the mapped description column
        else if (descriptionCol && row[descriptionCol]) {
          description = (row[descriptionCol] || "").toString().trim();
          if (description) {
            console.log(`[DEBUG] Using mapped description column "${descriptionCol}": "${description.substring(0, 50)}"`);
          }
        }
        // Fallback: try common description column names
        if (!description || description === "") {
          const possibleDescCols = Object.keys(row).filter(key => 
            !key.startsWith('_') && // Skip internal fields
            (key.toLowerCase().includes('desc') || 
             key.toLowerCase().includes('description') ||
             key.toLowerCase().includes('item') ||
             key.toLowerCase().includes('work'))
          );
          if (possibleDescCols.length > 0) {
            description = (row[possibleDescCols[0]] || "").toString().trim();
            if (description) {
              console.log(`[DEBUG] Using fallback description column "${possibleDescCols[0]}": "${description.substring(0, 50)}"`);
            }
          }
        }
        
        // Last resort: check all columns for the longest text value (likely description)
        if (!description || description === "") {
          const allKeys = Object.keys(row).filter(key => !key.startsWith('_'));
          let longestText = "";
          let longestLength = 0;
          for (const key of allKeys) {
            const value = String(row[key] || "").trim();
            // Skip if it looks like a number, unit, or code
            if (value.length > longestLength && 
                !value.match(/^\d+$/) && 
                !value.match(/^(No|EA|Rolls|Sets|LM)\s*\d+$/i) &&
                value.length > 5) {
              longestText = value;
              longestLength = value.length;
            }
          }
          if (longestText) {
            description = longestText;
            console.log(`[FIX] Found description by longest text method from column: "${description.substring(0, 50)}"`);
          } else {
            console.warn(`[WARN] No description found for row. Available keys:`, Object.keys(row));
            console.warn(`[WARN] Row values:`, Object.entries(row).map(([k, v]) => `${k}: ${String(v).substring(0, 30)}`));
          }
        }
        
        // Use extracted unit/quantity if available, otherwise try to find them
        const unit = row._extractedUnit || (unitCol ? (row[unitCol] || "").toString().trim() : "") || "";
        const quantity = row._extractedQuantity !== undefined 
          ? row._extractedQuantity 
          : (this.parseAmount(quantityCol ? row[quantityCol] : undefined) || 0);
        const price = this.parseAmount(priceCol ? row[priceCol] : undefined) || 0;

        // Use TOTAL PRICE column if available, otherwise calculate
        let rowTotalPrice = 0;
        if (totalPriceCol && row[totalPriceCol]) {
          rowTotalPrice = this.parseAmount(row[totalPriceCol]) || 0;
        }
        // Fallback: calculated amount if no total price found
        if (!rowTotalPrice && quantity > 0 && price > 0) {
          rowTotalPrice = quantity * price;
        }

        // Log for debugging if description is missing
        if (!description || description === "") {
          console.log(`[WARN] Row in group ${groupIndex} has no description. Row keys:`, Object.keys(row));
        }

        if (description && description.trim() !== "") {
          descriptions.push(description.trim());
        }
        if (unit && unit.trim() !== "") {
          units.add(unit.trim());
        }
        totalQuantity += quantity;
        totalAmount += rowTotalPrice;
      }

      // Build combined description - ALWAYS use description as title
      if (descriptions.length > 0) {
        if (descriptions.length === 1) {
          combinedDescription = descriptions[0];
        } else {
          // For multiple descriptions, use the first one as primary title
          // and include others in the description field
          combinedDescription = descriptions[0];
        }
      }

      // Use the most common unit, or first unit found
      if (units.size > 0) {
        combinedUnit = Array.from(units)[0];
      }

      // Include ALL rows with descriptions, even if no quantity/amount
      // Only skip if completely empty
      if (!combinedDescription && totalQuantity === 0 && totalAmount === 0 && group.length === 0) {
        continue;
      }

      // ALWAYS use description as phase title - never fall back to codes/units
      // If no description, try to construct from available data
      let phaseTitle = "";
      
      // First priority: use combined description
      if (combinedDescription && combinedDescription.trim() !== "") {
        phaseTitle = combinedDescription.trim();
        console.log(`[DEBUG] Phase ${groupIndex + 1} title from combinedDescription: "${phaseTitle.substring(0, 50)}"`);
      } else if (group.length > 0) {
        // Fallback: try to get description from first row using multiple methods
        const firstRow = group[0];
        let firstDesc = "";
        
        // First try: use extracted description
        if (firstRow._extractedDescription && firstRow._extractedDescription.trim() !== "") {
          firstDesc = firstRow._extractedDescription.toString().trim();
          console.log(`[DEBUG] Phase ${groupIndex + 1} using _extractedDescription: "${firstDesc.substring(0, 50)}"`);
        }
        // Second try: use the mapped description column
        else if (descriptionCol && firstRow[descriptionCol]) {
          firstDesc = (firstRow[descriptionCol] || "").toString().trim();
          if (firstDesc) {
            console.log(`[DEBUG] Phase ${groupIndex + 1} using mapped column "${descriptionCol}": "${firstDesc.substring(0, 50)}"`);
          }
        }
        
        // If still empty, try to find any column that might contain description
        if (!firstDesc || firstDesc === "") {
          const rowKeys = Object.keys(firstRow).filter(key => !key.startsWith('_'));
          const descKey = rowKeys.find(key => {
            const keyLower = key.toLowerCase();
            const value = String(firstRow[key] || "").trim();
            return (keyLower.includes('desc') || 
                   keyLower.includes('description') ||
                   keyLower.includes('item') ||
                   keyLower.includes('work')) &&
                   value.length > 5 && // Must be longer than unit codes
                   !value.match(/^(No|EA|Rolls|Sets|LM)\s*\d+$/i); // Not unit+qty
          });
          if (descKey) {
            firstDesc = firstRow[descKey].toString().trim();
            console.log(`[DEBUG] Phase ${groupIndex + 1} using found column "${descKey}": "${firstDesc.substring(0, 50)}"`);
          }
        }
        
        // Last resort: find longest text value
        if (!firstDesc || firstDesc === "") {
          const allKeys = Object.keys(firstRow).filter(key => !key.startsWith('_'));
          let longestText = "";
          let longestLength = 0;
          for (const key of allKeys) {
            const value = String(firstRow[key] || "").trim();
            if (value.length > longestLength && 
                !value.match(/^\d+$/) && 
                !value.match(/^(No|EA|Rolls|Sets|LM)\s*\d+$/i) &&
                value.length > 5) {
              longestText = value;
              longestLength = value.length;
            }
          }
          if (longestText) {
            firstDesc = longestText;
            console.log(`[FIX] Phase ${groupIndex + 1} using longest text: "${firstDesc.substring(0, 50)}"`);
          }
        }
        
        if (firstDesc && firstDesc.trim() !== "") {
          phaseTitle = firstDesc.trim();
        } else {
          // Last resort: log warning and use a generic title
          console.error(`[ERROR] Phase ${groupIndex + 1} has no description. Row keys:`, Object.keys(firstRow));
          console.error(`[ERROR] Row values:`, Object.entries(firstRow).map(([k, v]) => `${k}: ${String(v).substring(0, 50)}`));
          phaseTitle = `Phase ${groupIndex + 1}`;
        }
      } else {
        phaseTitle = `Phase ${groupIndex + 1}`;
      }
      
      // Final check: if phaseTitle is still just unit/qty, try harder to find description
      if (phaseTitle === `${combinedUnit} ${totalQuantity}`.trim() || 
          phaseTitle.match(/^(No|EA|Rolls|Sets|LM)\s*\d+$/i)) {
        console.error(`[ERROR] Phase title is unit/qty only: "${phaseTitle}". Descriptions found:`, descriptions);
        console.error(`[ERROR] Row data sample:`, group[0]);
        console.error(`[ERROR] Available columns:`, Object.keys(group[0]));
        
        // Try one more time to find description in any column
        if (group.length > 0) {
          const firstRow = group[0];
          const allKeys = Object.keys(firstRow);
          const descCandidate = allKeys.find(key => {
            const value = String(firstRow[key] || "").trim();
            return value.length > 10 && // Longer than unit/qty codes
                   !value.match(/^\d+$/) && // Not just a number
                   !value.match(/^(No|EA|Rolls|Sets|LM)\s*\d+$/i) && // Not unit+qty
                   value.length > (combinedUnit?.length || 0) + 5; // Longer than unit name
          });
          
          if (descCandidate && firstRow[descCandidate]) {
            const foundDesc = String(firstRow[descCandidate]).trim();
            if (foundDesc) {
              console.log(`[FIX] Found description in column "${descCandidate}": "${foundDesc}"`);
              phaseTitle = foundDesc;
              // Update combinedDescription for logging
              combinedDescription = foundDesc;
            }
          }
        }
      }

      // Calculate phase dates
      const phaseStartDate = new Date(projectStartDate);
      phaseStartDate.setDate(phaseStartDate.getDate() + groupIndex * daysPerPhase);
      const phaseEndDate = new Date(phaseStartDate);
      phaseEndDate.setDate(phaseEndDate.getDate() + daysPerPhase);

      // The title field should contain the description extracted from BOQ descriptions column
      // For the description field, include additional metadata if multiple items
      const descParts: string[] = [];
      if (combinedUnit) descParts.push(`Unit: ${combinedUnit}`);
      if (totalQuantity > 0) descParts.push(`Quantity: ${totalQuantity}`);
      if (group.length > 1) descParts.push(`Grouped Items: ${group.length}`);
      
      // If multiple descriptions, include all in description field; otherwise use metadata only
      const phaseDescription = descriptions.length > 1
        ? descriptions.join("; ") + (descParts.length > 0 ? ` | ${descParts.join(" | ")}` : "")
        : (descParts.length > 0 ? descParts.join(" | ") : "");
        
      // ✅ 4. Debug the exact failure point - validate projectId before creating phase
      console.log(`[DEBUG] Creating phase ${groupIndex + 1} - projectId: ${projectId}, phaseTitle: "${phaseTitle.substring(0, 50)}"`);
      
      if (!projectId || projectId.trim() === '') {
        console.error(`[ERROR] projectId is undefined when creating phase "${phaseTitle}"`);
        throw new Error('Project ID is required when creating phases from BOQ data');
      }

      const phaseData = {
        // Title is the description extracted from BOQ descriptions column
        title: phaseTitle,
        // Description field contains additional metadata or multiple descriptions if grouped
        description: phaseDescription,
        budget: totalAmount || 0,
        start_date: phaseStartDate,
        end_date: phaseEndDate,
        due_date: phaseEndDate,
        progress: 0,
        status: PhaseStatus.NOT_STARTED,
        project_id: projectId, // Explicitly set project_id - this is critical
      };

      // ✅ Final validation before INSERT
      if (!phaseData.project_id || phaseData.project_id.trim() === '') {
        console.error('[ERROR] Phase data missing project_id:', phaseData);
        throw new Error('Cannot create phase without project_id');
      }

      // Use raw query to insert directly and avoid TypeORM relation update issues
      const insertQuery = `
        INSERT INTO phase (
          title, description, budget, start_date, end_date, due_date, 
          progress, status, project_id, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        ) RETURNING *
      `;

      // ✅ Debug before query
      console.log(`[DEBUG] Inserting phase with project_id: ${phaseData.project_id}`);

      const result = await this.phasesRepository.query(insertQuery, [
        phaseData.title,
        phaseData.description,
        phaseData.budget,
        phaseData.start_date,
        phaseData.end_date,
        phaseData.due_date,
        phaseData.progress,
        phaseData.status,
        phaseData.project_id, // This ensures project_id is set
      ]);

      if (!result || result.length === 0 || !result[0]) {
        console.error(
          `Failed to create phase: ${phaseTitle} - No result from insert`
        );
        throw new Error(`Failed to create phase: ${phaseTitle}`);
      }

      // ✅ Verify project_id was set correctly
      if (!result[0].project_id) {
        // ✅ 1. Validate projectId before attempting UPDATE
        if (!projectId || projectId.trim() === '') {
          console.error(`[ERROR] projectId is undefined when trying to fix phase project_id! Phase ID: ${result[0].id}`);
          // Delete the phase that was created without project_id to avoid orphaned records
          await this.phasesRepository.query(
            `DELETE FROM phase WHERE id = $1`,
            [result[0].id]
          );
          throw new Error(`Cannot create phase without project_id. Phase ${result[0].id} was deleted.`);
        }
        
        console.error(
          `Error: Phase created without project_id. Phase ID: ${result[0].id}, Project ID: ${projectId}`
        );
        // Try to fix it by updating - but only if projectId is valid
        await this.phasesRepository.query(
          `UPDATE phase SET project_id = $1 WHERE id = $2`,
          [projectId, result[0].id]
        );
        result[0].project_id = projectId;
      }

      // Query the phase back from database to get a properly tracked entity with relations
      // This ensures TypeORM has the correct state and won't try to update it incorrectly
      const savedPhase = await this.phasesRepository.findOne({
        where: { id: result[0].id },
        relations: ['project'],
      });

      if (!savedPhase) {
        console.error(`Failed to retrieve created phase: ${result[0].id}`);
        throw new Error(`Failed to retrieve created phase: ${phaseTitle}`);
      }

      // ✅ Ensure the project relation is properly set using the project object we already have
      if (!savedPhase.project || savedPhase.project.id !== projectId) {
        console.log(`[DEBUG] Setting project relation for phase ${savedPhase.id}`);
        
        // Use the project object we already fetched at the start of the method
        // Set the project relation explicitly
        savedPhase.project = project;
        savedPhase.project_id = projectId;
        
        // Save to ensure the relation is persisted
        await this.phasesRepository.save(savedPhase);
        console.log(`[DEBUG] Project relation set for phase ${savedPhase.id} - project.id: ${project.id}`);
      } else {
        console.log(`[DEBUG] Phase ${savedPhase.id} already has correct project relation - project.id: ${savedPhase.project.id}`);
      }

      // Verify the relation is correct
      if (savedPhase.project_id !== projectId) {
        console.error(`[ERROR] Phase ${savedPhase.id} has incorrect project_id: ${savedPhase.project_id}, expected: ${projectId}`);
        throw new Error(`Phase ${savedPhase.id} has incorrect project_id`);
      }

      phases.push(savedPhase);

      console.log(
        `Created phase: "${phaseTitle}" (Budget: ${totalAmount}, Items: ${group.length}, Description: "${combinedDescription || 'N/A'}", Unit: ${combinedUnit || 'N/A'}, Qty: ${totalQuantity}, Project ID: ${projectId})`
      );
    }

    // ✅ Final verification: Ensure all phases are properly related to the project
    console.log(`[DEBUG] Verifying all ${phases.length} phases are properly related to project ${projectId}`);
    for (const phase of phases) {
      if (!phase.project_id || phase.project_id !== projectId) {
        console.error(`[ERROR] Phase ${phase.id} has incorrect project_id: ${phase.project_id}, expected: ${projectId}`);
        throw new Error(`Phase ${phase.id} is not properly related to project ${projectId}`);
      }
      if (!phase.project || phase.project.id !== projectId) {
        console.warn(`[WARN] Phase ${phase.id} project relation not set, fixing...`);
        phase.project = project;
        phase.project_id = projectId;
        await this.phasesRepository.save(phase);
      }
    }
    console.log(`[DEBUG] All ${phases.length} phases verified and properly related to project ${projectId}`);

    return phases;
  }

  private async createTasksFromBoqData(
    data: any[],
    projectId: string
  ): Promise<Task[]> {
    // Get column mappings from the first row keys (CSV headers)
    const rowKeys = data.length > 0 ? Object.keys(data[0]) : [];
    const columnMappings = this.getColumnMappingsFromHeaders(rowKeys);
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

  /**
   * Preview BOQ file without creating phases - returns what phases would be created
   */
  /**
   * Preview BOQ file without creating phases - returns what phases would be created
   * Uses the robust BOQ parser with hard validation
   */
  async previewBoqFile(file: Express.Multer.File): Promise<{
    phases: Array<{
      title: string;
      description: string;
      budget: number;
      unit?: string;
      quantity?: number;
      rate?: number;
      mainSection?: string;
      subSection?: string;
    }>;
    totalAmount: number;
    totalPhases: number;
  }> {
    if (!file?.buffer) {
      throw new BadRequestException("No file uploaded or file buffer missing");
    }

    console.log(`[BOQ Preview] Parsing file: ${file.originalname}`);
    
    // Use the robust BOQ parser
    const parseResult = await this.boqParserService.parseBoqFile(file);
    
    console.log(`[BOQ Preview] Parser results:`, {
      itemsFound: parseResult.items.length,
      totalAmount: parseResult.totalAmount,
      sections: parseResult.sections,
      skipped: parseResult.metadata.skippedRows,
    });
    
    // Map validated BOQ items to phase previews
    // All items from parser are already validated (have description, quantity, unit)
    const phases = parseResult.items.map((item) => {
      // Build description with metadata
      const descParts: string[] = [];
      if (item.section) descParts.push(`Section: ${item.section}`);
      descParts.push(`Unit: ${item.unit}`);
      descParts.push(`Quantity: ${item.quantity}`);
      if (item.rate > 0) descParts.push(`Rate: ${item.rate}`);
      
      return {
        title: item.description, // Title = Description from BOQ
        description: descParts.join(' | '),
        budget: item.amount || 0,
        unit: item.unit,
        quantity: item.quantity,
        rate: item.rate > 0 ? item.rate : undefined,
        mainSection: item.section || undefined,
        subSection: item.subSection || undefined,
      };
    });
    
    console.log(`[BOQ Preview] Generated ${phases.length} phase previews`);
    
    return {
      phases,
      totalAmount: parseResult.totalAmount,
      totalPhases: phases.length,
    };
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
      relations: ["phases", "phases.subPhases", "owner", "collaborators"],
    });
    
    // Calculate progress for each project
    const calculatePhaseCompletion = (phase: Phase): number => {
      if (!phase.subPhases || phase.subPhases.length === 0) {
        return phase.progress || 0;
      }
      const completed = phase.subPhases.filter((sp) => sp.isCompleted).length;
      return Math.round((completed / phase.subPhases.length) * 100);
    };

    return projects.map((project) => {
      const phases = project.phases || [];
      const projectProgress =
        phases.length > 0
          ? Math.round(
              phases.reduce((sum, p) => sum + calculatePhaseCompletion(p), 0) /
                phases.length
            )
          : 0;
      const completedPhases = phases.filter(
        (p) => p.status === "completed"
      ).length;

      return {
        id: project.id,
        name: project.title,
        description: project.description,
        progress: projectProgress,
        completedPhases,
        totalPhases: phases.length,
        totalAmount: project.totalAmount,
        totalBudget: project.totalAmount,
        startDate: project.start_date,
        estimatedCompletion: project.end_date,
        owner: project.owner?.display_name || project.owner_id,
        collaborators: (project.collaborators || []).map(
          (c) => c.display_name || c.id
        ),
        tags: project.tags || [],
        phases: phases.map((phase) => ({
          id: phase.id,
          name: phase.title,
          title: phase.title,
          status: phase.status,
          startDate: phase.start_date,
          endDate: phase.end_date,
          subPhases: (phase.subPhases || []).map((sub) => ({
            id: sub.id,
            title: sub.title,
            description: sub.description,
            isCompleted: sub.isCompleted,
          })),
        })),
        isOwner: false, // Consultants are not owners
        isCollaborator: true, // Consultants are collaborators
        hasPendingInvite: false,
      };
    });
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
      description: project.description,
      owner: project.owner?.display_name || project.owner_id,
      collaborators: (project.collaborators || []).map(
        (c) => c.display_name || c.id
      ),
      startDate: project.start_date,
      estimatedCompletion: project.end_date,
      totalAmount: project.totalAmount,
      tags: project.tags || [],
      phases: (project.phases || []).map((phase) => ({
        id: phase.id,
        name: phase.title,
        title: phase.title,
        status: phase.status,
        startDate: phase.start_date,
        start_date: phase.start_date,
        endDate: phase.end_date,
        end_date: phase.end_date,
        progress: phase.progress || 0,
        sub_phases: (phase.subPhases || []).map((sub) => ({
          id: sub.id,
          title: sub.title,
          description: sub.description,
          isCompleted: sub.isCompleted,
        })),
        subPhases: (phase.subPhases || []).map((sub) => ({
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
    // Only return active phases (excludes BOQ draft phases)
    const phases = await this.phasesRepository.find({
      where: { project_id: projectId, is_active: true },
      relations: ["subPhases", "subPhases.subPhases"],
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

  // Consultant: Get phases for a project with pagination (consultant-facing)
  async getConsultantProjectPhasesPaginated(
    projectId: string,
    { page = 1, limit = 10 }: { page?: number; limit?: number }
  ) {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    // Only return active phases (excludes BOQ draft phases)
    const [phases, total] = await this.phasesRepository.findAndCount({
      where: { project_id: projectId, is_active: true },
      relations: ["subPhases", "subPhases.subPhases"],
      order: { created_at: "ASC" },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    });

    // Return public fields for phases and their subPhases
    const items = phases.map((phase) => ({
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

    return {
      items,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  /**
   * Get BOQ draft phases (inactive phases created from BOQ upload)
   * These are hidden phases that user can choose to activate
   */
  async getBoqDraftPhases(projectId: string, userId: string): Promise<Phase[]> {
    // Verify user has access to project
    await this.findOne(projectId, userId);
    
    return this.phasesRepository.find({
      where: { 
        project_id: projectId, 
        is_active: false,
        from_boq: true 
      },
      relations: ["subPhases"],
      order: { created_at: "ASC" },
    });
  }

  /**
   * Activate selected BOQ phases (make them visible in project)
   */
  async activateBoqPhases(
    projectId: string, 
    phaseIds: string[], 
    userId: string
  ): Promise<{ activated: number; phases: Phase[] }> {
    // Verify user has access to project
    const project = await this.findOne(projectId, userId);
    
    if (!phaseIds || phaseIds.length === 0) {
      throw new BadRequestException('No phase IDs provided');
    }

    console.log(`[Activate BOQ Phases] Activating ${phaseIds.length} phases for project ${projectId}`);

    const activatedPhases: Phase[] = [];

    for (const phaseId of phaseIds) {
      const phase = await this.phasesRepository.findOne({
        where: { 
          id: phaseId, 
          project_id: projectId,
          from_boq: true 
        },
      });

      if (!phase) {
        console.warn(`[Activate BOQ Phases] Phase ${phaseId} not found or not from BOQ`);
        continue;
      }

      // Activate the phase
      phase.is_active = true;
      await this.phasesRepository.save(phase);
      activatedPhases.push(phase);

      console.log(`[Activate BOQ Phases] ✅ Activated phase: "${phase.title}"`);
    }

    // Log activity for activated phases (optional - best effort)
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
          console.warn(`Failed to log activity for phase ${phase.id}:`, err);
        }
      }
    } catch (error) {
      console.warn('Failed to log phase activation activities:', error);
    }

    return {
      activated: activatedPhases.length,
      phases: activatedPhases,
    };
  }

  // Consultant: Get tasks for a project (consultant-facing)
  async getConsultantProjectTasks(projectId: string): Promise<any[]> {
    const project = await this.projectsRepository.findOne({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException("Project not found");
    }
    const phases = await this.phasesRepository.find({
      where: { project_id: projectId },
      relations: ["tasks"],
    });

    const allTasks = phases.flatMap((phase) =>
      phase.tasks.map((task) => ({
        id: task.id,
        description: task.description,
        unit: task.unit,
        quantity: task.quantity,
        price: task.price,
        phase_id: phase.id,
        phase_title: phase.title,
        created_at: task.created_at,
      }))
    );

    return allTasks;
  }

  async getProjectCompletionTrends(
    period: string = "daily",
    from?: string,
    to?: string
  ) {
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

    const qb = this.projectsRepository
      .createQueryBuilder("project")
      .select(`to_char(project.updated_at, '${groupFormat}')`, "date")
      .addSelect(
        "COUNT(CASE WHEN project.status = 'completed' THEN 1 END)",
        "completed"
      )
      .addSelect("COUNT(*)", "total");

    if (startDate) {
      qb.andWhere("project.updated_at >= :startDate", { startDate });
    }
    if (endDate) {
      qb.andWhere("project.updated_at <= :endDate", { endDate });
    }

    qb.groupBy("date").orderBy("date", "ASC");

    const results = await qb.getRawMany();

    return results.map((result) => ({
      date: result.date,
      completed: parseInt(result.completed || "0"),
      total: parseInt(result.total || "0"),
      completionRate:
        result.total > 0
          ? (parseInt(result.completed || "0") / parseInt(result.total)) * 100
          : 0,
    }));
  }

  // ==================== PROJECT INVENTORY METHODS ====================

  /**
   * Get inventory items for a specific project
   */
  async getProjectInventory(
    projectId: string,
    userId: string,
    options: {
      page?: number;
      limit?: number;
      category?: string;
      search?: string;
    }
  ) {
    // Verify user has access to the project
    const user = await this.usersService.findOne(userId);
    const isContractor = user?.role === UserRole.CONTRACTOR;
    const isSubContractor = user?.role === UserRole.SUB_CONTRACTOR;

    if (!isContractor && !isSubContractor) {
      await this.findOne(projectId, userId);
    } else {
      const project = await this.projectsRepository.findOne({
        where: { id: projectId },
      });
      if (!project) {
        throw new NotFoundException(`Project with ID ${projectId} not found`);
      }
    }

    const { page = 1, limit = 10, category, search } = options;
    const skip = (page - 1) * limit;

    const where: any = { project_id: projectId, is_active: true };

    if (category) {
      where.category = category;
    }

    const queryBuilder = this.inventoryRepository.createQueryBuilder("inventory")
      .leftJoinAndSelect("inventory.creator", "creator")
      .where("inventory.project_id = :projectId", { projectId })
      .andWhere("inventory.is_active = :is_active", { is_active: true });

    if (category) {
      queryBuilder.andWhere("inventory.category = :category", { category });
    }

    if (search) {
      queryBuilder.andWhere(
        "(inventory.name ILIKE :search OR inventory.description ILIKE :search OR inventory.sku ILIKE :search)",
        { search: `%${search}%` }
      );
    }

    const [items, total] = await queryBuilder
      .orderBy("inventory.created_at", "DESC")
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Add inventory item to a project (contractors and sub-contractors only)
   */
  async addProjectInventoryItem(
    projectId: string,
    createInventoryDto: any,
    userId: string,
    pictureFile?: Express.Multer.File
  ) {
    // Verify user is contractor or sub-contractor
    const user = await this.usersService.findOne(userId);
    if (user?.role !== UserRole.CONTRACTOR && user?.role !== UserRole.SUB_CONTRACTOR) {
      throw new ForbiddenException(
        "Only contractors and sub-contractors can add inventory items to projects"
      );
    }

    // Verify project exists
    const project = await this.projectsRepository.findOne({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    // Handle picture upload (required)
    let pictureUrl: string | null = null;
    if (pictureFile) {
      const uploadDir = path.join(
        process.cwd(),
        "uploads",
        "inventory",
        "pictures"
      );
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const fileName = `${Date.now()}-${pictureFile.originalname.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, pictureFile.buffer);
      pictureUrl = `/uploads/inventory/pictures/${fileName}`;
    } else {
      throw new BadRequestException("Picture evidence is required");
    }

    // Create inventory item linked to the project
    const inventory = this.inventoryRepository.create({
      ...createInventoryDto,
      project_id: projectId,
      picture_url: pictureUrl,
      created_by: userId,
    });

    const saved = await this.inventoryRepository.save(inventory);

    // Log activity
    await this.activitiesService.logActivity(
      ActivityType.INVENTORY_ADDED,
      userId,
      projectId,
      { 
        inventoryName: saved.name,
        category: saved.category,
        quantity: saved.quantity_available 
      }
    );

    return saved;
  }

  /**
   * Update project inventory item (contractors and sub-contractors only)
   */
  async updateProjectInventoryItem(
    projectId: string,
    inventoryId: string,
    updateData: any,
    userId: string
  ) {
    // Verify user is contractor or sub-contractor
    const user = await this.usersService.findOne(userId);
    if (user?.role !== UserRole.CONTRACTOR && user?.role !== UserRole.SUB_CONTRACTOR) {
      throw new ForbiddenException(
        "Only contractors and sub-contractors can update inventory items"
      );
    }

    // Verify inventory item belongs to the project
    const inventory = await this.inventoryRepository.findOne({
      where: { id: inventoryId, project_id: projectId },
    });

    if (!inventory) {
      throw new NotFoundException(
        `Inventory item not found in this project`
      );
    }

    Object.assign(inventory, updateData);
    const updated = await this.inventoryRepository.save(inventory);

    // Log activity
    await this.activitiesService.logActivity(
      ActivityType.INVENTORY_UPDATED,
      userId,
      projectId,
      { inventoryName: updated.name }
    );

    return updated;
  }

  /**
   * Delete project inventory item (contractors and sub-contractors only)
   */
  async deleteProjectInventoryItem(
    projectId: string,
    inventoryId: string,
    userId: string
  ) {
    // Verify user is contractor or sub-contractor
    const user = await this.usersService.findOne(userId);
    if (user?.role !== UserRole.CONTRACTOR && user?.role !== UserRole.SUB_CONTRACTOR) {
      throw new ForbiddenException(
        "Only contractors and sub-contractors can delete inventory items"
      );
    }

    // Verify inventory item belongs to the project
    const inventory = await this.inventoryRepository.findOne({
      where: { id: inventoryId, project_id: projectId },
    });

    if (!inventory) {
      throw new NotFoundException(
        `Inventory item not found in this project`
      );
    }

    await this.inventoryRepository.remove(inventory);

    // Log activity
    await this.activitiesService.logActivity(
      ActivityType.INVENTORY_DELETED,
      userId,
      projectId,
      { inventoryName: inventory.name }
    );

    return { message: "Inventory item deleted successfully" };
  }
}
