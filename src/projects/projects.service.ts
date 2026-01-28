import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
  forwardRef,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In, Between, Like, DataSource } from "typeorm";
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
import { parseAmount, validateAndNormalizeAmount } from "../utils/amount.utils";
import { Inventory, InventoryCategory } from "../entities/inventory.entity";
import { InventoryUsage } from "../entities/inventory-usage.entity";
import { ProjectDashboardService } from "./services/project-dashboard.service";
import { ProjectConsultantService } from "./services/project-consultant.service";
import { ProjectContractorService } from "./services/project-contractor.service";
import { ProjectPhaseService } from "./services/project-phase.service";
import { ProjectBoqService } from "./services/project-boq.service";
import { ProjectCollaborationService } from "./services/project-collaboration.service";
import { ProjectBoq, BOQType, BOQStatus } from "../entities/project-boq.entity";
import { ProjectFinancialSummary } from "../entities/project-financial-summary.entity";
import { ProjectMetadata } from "../entities/project-metadata.entity";
import { ProjectSettings } from "../entities/project-settings.entity";
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
    @InjectRepository(InventoryUsage)
    private readonly inventoryUsageRepository: Repository<InventoryUsage>,
    @InjectRepository(ProjectBoq)
    private readonly projectBoqRepository: Repository<ProjectBoq>,
    @InjectRepository(ProjectFinancialSummary)
    private readonly financialSummaryRepository: Repository<ProjectFinancialSummary>,
    @InjectRepository(ProjectMetadata)
    private readonly metadataRepository: Repository<ProjectMetadata>,
    @InjectRepository(ProjectSettings)
    private readonly settingsRepository: Repository<ProjectSettings>,
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => ActivitiesService))
    private readonly activitiesService: ActivitiesService,
    private readonly tasksService: TasksService,
    @Inject(forwardRef(() => DashboardService))
    private readonly dashboardService: DashboardService,
    private readonly boqParserService: BoqParserService,
    private readonly projectDashboardService: ProjectDashboardService,
    private readonly projectConsultantService: ProjectConsultantService,
    private readonly projectContractorService: ProjectContractorService,
    private readonly projectPhaseService: ProjectPhaseService,
    private readonly projectBoqService: ProjectBoqService,
    private readonly projectCollaborationService: ProjectCollaborationService,
    private readonly dataSource: DataSource
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
      .leftJoinAndSelect("project.collaborators", "collaborators");
    // Removed phases and subPhases loading for performance - only load when viewing project details

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

    // Check project access based on user role
    if (userId) {
      const user = await this.usersService.findOne(userId);
      const isContractor = user?.role === "contractor";
      const isSubContractor = user?.role === "sub_contractor";
      const isConsultant = user?.role === "consultant";

      // Consultants can access all projects (they create projects)
      if (isConsultant) {
        // Allow access - consultants can view all projects
      } 
      // Contractors and sub-contractors can only access projects they're invited to (owner or collaborator)
      else if (isContractor || isSubContractor) {
        if (!this.hasProjectAccess(project, userId)) {
          throw new ForbiddenException("You don't have access to this project. You need to be invited or added as a collaborator.");
        }
      }
      // Other users must be owner or collaborator
      else {
        if (!this.hasProjectAccess(project, userId)) {
          throw new ForbiddenException("You don't have access to this project");
        }
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

    // Use QueryRunner for transaction management
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create project
      const project = queryRunner.manager.create(Project, {
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
        totalAmount: this.validateAndNormalizeProjectAmount(
          createProjectDto.totalAmount ?? 0
        ),
      });

      // Handle collaborators if provided
      if (createProjectDto.collaborator_ids?.length) {
        const collaborators = await this.getValidatedCollaborators(
          createProjectDto.collaborator_ids
        );
        project.collaborators = collaborators;
      }

      const savedProject = await queryRunner.manager.save(Project, project);

      // Create financial summary
      const financialSummary = queryRunner.manager.create(ProjectFinancialSummary, {
        project_id: savedProject.id,
        totalBudget: createProjectDto.totalAmount || 0,
        spentAmount: 0,
        allocatedBudget: 0,
        estimatedSavings: 0,
        financialStatus: 'on_track',
        budgetLastUpdated: new Date(),
      });
      await queryRunner.manager.save(ProjectFinancialSummary, financialSummary);

      // Create metadata
      const metadata = queryRunner.manager.create(ProjectMetadata, {
        project_id: savedProject.id,
      });
      await queryRunner.manager.save(ProjectMetadata, metadata);

      // Create settings
      const settings = queryRunner.manager.create(ProjectSettings, {
        project_id: savedProject.id,
      });
      await queryRunner.manager.save(ProjectSettings, settings);

      await queryRunner.commitTransaction();

      // Log activity outside transaction
      try {
        await this.activitiesService.logProjectCreated(owner, savedProject, null);
      } catch (error) {
        // Failed to log project creation activity - don't fail the operation
        console.error('Failed to log project creation activity:', error);
      }

      // Update dashboard stats outside transaction
      try {
        await this.dashboardService.updateStats();
      } catch (error) {
        console.error('Failed to update dashboard stats:', error);
      }

      return this.findOne(savedProject.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async update(
    id: string,
    updateProjectDto: UpdateProjectDto,
    userId: string
  ): Promise<Project> {
    const project = await this.findOne(id);
    const user = await this.usersService.findOne(userId);
    const isAdmin = user?.role === "consultant";
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
    const isAdmin = user?.role === "consultant";
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
    return this.projectCollaborationService.addCollaborator(
      projectId,
      collaborator,
      userId
    );
  }

  async removeCollaborator(
    projectId: string,
    collaboratorId: string,
    userId: string
  ): Promise<Project> {
    return this.projectCollaborationService.removeCollaborator(
      projectId,
      collaboratorId,
      userId
    );
  }

  async processBoqFile(
    projectId: string,
    file: Express.Multer.File,
    userId: string
  ): Promise<ProcessBoqResult> {
    return this.projectBoqService.processBoqFile(projectId, file, userId);
  }

  async processBoqFileFromParsedData(
    projectId: string,
    data: any[],
    totalAmount: number,
    userId: string,
    file?: Express.Multer.File,
    type?: 'contractor' | 'sub_contractor'
  ): Promise<ProcessBoqResult> {
    return this.projectBoqService.processBoqFileFromParsedData(
      projectId,
      data,
      totalAmount,
      userId,
      file?.originalname,
      file,
      type
    );
  }

  async createPhase(
    projectId: string,
    createPhaseDto: CreatePhaseDto,
    userId: string
  ): Promise<Phase> {
    return this.projectPhaseService.createPhase(
      projectId,
      createPhaseDto,
      userId
    );
  }

  async updatePhase(
    projectId: string,
    phaseId: string,
    updatePhaseDto: UpdatePhaseDto,
    userId: string
  ): Promise<Phase> {
    return this.projectPhaseService.updatePhase(
      projectId,
      phaseId,
      updatePhaseDto,
      userId
    );
  }

  async deletePhase(
    projectId: string,
    phaseId: string,
    userId: string
  ): Promise<void> {
    return this.projectPhaseService.deletePhase(projectId, phaseId, userId);
  }

  async getProjectPhases(projectId: string, userId: string): Promise<Phase[]> {
    return this.projectContractorService.getProjectPhases(projectId, userId);
  }

  async getProjectPhasesPaginated(
    projectId: string,
    userId: string,
    { page = 1, limit = 10 }: { page?: number; limit?: number }
  ) {
    // Use projectContractorService for contractors/sub-contractors, projectPhaseService for others
    const user = await this.usersService.findOne(userId);
    const userRole = user?.role?.toLowerCase();
    
    if (userRole === 'contractor' || userRole === 'sub_contractor') {
      return this.projectContractorService.getProjectPhasesPaginated(
        projectId,
        userId,
        { page, limit }
      );
    } else {
      return this.projectPhaseService.getProjectPhasesPaginated(
        projectId,
        userId,
        { page, limit }
      );
    }
  }

  async getContractorPhasesForLinking(projectId: string, userId: string): Promise<any[]> {
    return this.projectContractorService.getContractorPhasesForLinking(projectId, userId);
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

  async getProjectResponse(project: Project, userId?: string): Promise<any> {
    // Calculate progress the same way as ContractorProjectDetails
    const calculatePhaseCompletion = (phase: Phase): number => {
      // If phase has subPhases, calculate based on subPhase completion
      if (phase.subPhases && phase.subPhases.length > 0) {
        const completed = phase.subPhases.filter((sp) => sp.isCompleted).length;
        return Math.round((completed / phase.subPhases.length) * 100);
      }

      // If phase has explicit progress value, use it
      if (phase.progress != null && phase.progress !== undefined) {
        const progress = Number(phase.progress);
        if (!Number.isNaN(progress) && Number.isFinite(progress)) {
          return Math.max(0, Math.min(100, Math.round(progress)));
        }
      }

      // Fallback: use phase status to determine progress
      if (phase.status === "completed") {
        return 100;
      } else if (phase.status === "in_progress") {
        return 50; // Default to 50% if in progress but no other indicators
      } else if (phase.status === "not_started") {
        return 0;
      }

      // Default to 0 if no indicators
      return 0;
    };

    // Handle case where phases aren't loaded (for performance in list views)
    const phases = project.phases || [];
    let projectProgress = 0;
    let completedPhases = 0;
    let totalPhases = 0;

    if (phases.length > 0) {
      // Phases are loaded, calculate detailed progress
      projectProgress = Math.round(
        phases.reduce((sum, p) => sum + calculatePhaseCompletion(p), 0) /
          phases.length
      );
      completedPhases = phases.filter((p) => p.status === "completed").length;
      totalPhases = phases.length;
    }
    // If phases not loaded, progress/phase counts will be 0 (can be fetched when viewing project details)

    // Determine if user is owner or collaborator
    const isOwner = userId ? project.owner_id === userId : false;
    const isCollaborator = userId
      ? (project.collaborators || []).some((c) => c.id === userId)
      : false;

    return {
      id: project.id,
      name: project.title,
      description: project.description,
      progress: projectProgress,
      completedPhases,
      totalPhases,
      totalAmount: project.totalAmount ?? 0,
      startDate: project.start_date,
      estimatedCompletion: project.end_date,
      owner: project.owner?.display_name || project.owner_id,
      collaborators: (project.collaborators || []).map(
        (c) => c.display_name || c.id
      ),
      tags: project.tags,
      isOwner: isOwner,
      isCollaborator: isCollaborator,
      // Only include phases if they were loaded (for performance)
      phases:
        phases.length > 0
          ? phases.map((phase) => ({
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
            }))
          : [],
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
    return this.projectCollaborationService.createJoinRequest(
      projectId,
      requesterId
    );
  }

  async listJoinRequestsForProject(projectId: string, ownerId: string) {
    return this.projectCollaborationService.listJoinRequestsForProject(
      projectId,
      ownerId
    );
  }

  async approveJoinRequest(
    projectId: string,
    requestId: string,
    ownerId: string
  ) {
    return this.projectCollaborationService.approveJoinRequest(
      projectId,
      requestId,
      ownerId
    );
  }

  async denyJoinRequest(projectId: string, requestId: string, ownerId: string) {
    return this.projectCollaborationService.denyJoinRequest(
      projectId,
      requestId,
      ownerId
    );
  }

  async listMyJoinRequests(userId: string) {
    return this.projectCollaborationService.listMyJoinRequests(userId);
  }

  async listJoinRequestsForOwner(ownerId: string) {
    return this.projectCollaborationService.listJoinRequestsForOwner(ownerId);
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
        const completedPhases = phases.filter(
          (phase) => phase.status === "completed"
        ).length;
        const totalPhases = phases.length;
        const progress =
          totalPhases > 0
            ? Math.round((completedPhases / totalPhases) * 100)
            : 0;
        const totalBudget = phases.reduce(
          (sum, phase) => sum + (phase.budget || 0),
          0
        );

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
          totalBudget: totalBudget || 0,
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

  // Use shared parseAmount utility - alias to avoid naming conflict
  private parseAmountValue = parseAmount;

  /**
   * Validate and normalize amount for decimal(20,2) - used for project amounts
   */
  private validateAndNormalizeProjectAmount(
    value: number | string | null | undefined
  ): number {
    return validateAndNormalizeAmount(value, 999999999999999999.99, 2);
  }

  private async parseBoqFile(file: Express.Multer.File): Promise<{
    data: any[];
    totalAmount: number;
  }> {
    // Parse CSV file - read ALL lines including empty ones for processing
    const csvContent = file.buffer.toString("utf-8");
    // Handle different line endings (Windows \r\n, Unix \n, Mac \r)
    const allLines = csvContent.split(/\r?\n/);

    if (allLines.length === 0) {
      throw new BadRequestException("CSV file is empty");
    }

    // Filter out completely empty lines (but keep lines with just whitespace for now)
    const lines = allLines.filter(
      (line) => line.trim().length > 0 || line.includes(",")
    );

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
        const englishPart = header.replace(/[\u4e00-\u9fff]/g, "").trim();
        const chinesePart = header.replace(/[a-zA-Z0-9\s]/g, "").trim();

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
    const rawData = lines
      .slice(1)
      .map((line, lineIndex) => {
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
          // Return a row with error flag instead of skipping
          return { _parseError: true, _originalLineIndex: lineIndex + 2 };
        }
      })
      .filter((row) => !row._parseError); // Only filter out rows with parse errors

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
        if (key.startsWith("_")) return false;
        const str = val?.toString().trim() || "";
        return str.length > 0 && str !== "-" && str !== "—" && str !== "N/A";
      });

      if (!hasAnyContent) {
        return false;
      }

      // Only filter based on description if it exists
      if (descriptionCol && row[descriptionCol]) {
        const desc = (row[descriptionCol] || "")
          .toString()
          .toLowerCase()
          .trim();

        // Only filter out CLEARLY invalid rows (totals, notes, instructions)
        // Be more lenient - only exclude if description is clearly a summary/instruction
        const isClearlyInvalid =
          desc === "total" ||
          desc === "sum" ||
          desc === "subtotal" ||
          desc === "grand total" ||
          desc.startsWith("note:") ||
          desc.startsWith("注意:") ||
          desc.startsWith("instruction") ||
          desc.startsWith("说明") ||
          (desc.includes("合计") && desc.length < 10) || // Short Chinese total
          (desc.includes("总计") && desc.length < 10); // Short Chinese grand total

        if (isClearlyInvalid) {
          return false;
        }
      }

      // If row has quantity or price, it's likely valid even without description
      if (
        !descriptionCol ||
        !row[descriptionCol] ||
        row[descriptionCol].trim() === ""
      ) {
        // Check if row has quantity or price - if so, keep it
        const hasQuantity =
          quantityCol &&
          row[quantityCol] &&
          row[quantityCol].toString().trim() !== "";
        const hasPrice =
          priceCol && row[priceCol] && row[priceCol].toString().trim() !== "";

        if (hasQuantity || hasPrice) {
          // Row has numeric data, keep it even without description
          return true;
        }
      }

      return true; // Keep all other rows
    });

    // Hierarchical Structure Detection: Identify Main Sections and Sub Sections
    const processedData = this.detectHierarchicalStructure(
      filteredData,
      headers
    );

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
        standardizedRow[totalPriceCol] = this.standardizeNumber(
          row[totalPriceCol]
        );
      }

      return standardizedRow;
    });

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
        return false;
      }

      // Include all other rows - even if description is empty, if they have quantity/price
      const desc = row[descriptionCol];
      const hasDescription =
        desc && typeof desc === "string" && desc.trim() !== "";

      // Check if row has quantity or price data
      const hasQuantity =
        quantityCol &&
        row[quantityCol] &&
        this.parseAmountValue(row[quantityCol]) > 0;
      const hasPrice =
        priceCol && row[priceCol] && this.parseAmountValue(row[priceCol]) > 0;

      // Include if has description OR has quantity/price data
      if (hasDescription || hasQuantity || hasPrice) {
        return true;
      }

      return false;
    });

    // Calculate total amount
    let totalAmount = 0;
    if (totalPriceCol) {
      // Sum all TOTAL PRICE values from valid rows
      totalAmount = validData.reduce((sum, row) => {
        const amount = this.parseAmountValue(row[totalPriceCol]) || 0;
        return sum + amount;
      }, 0);
    } else {
      // Fallback: calculate from individual rows using TOTAL PRICE or quantity * price
      totalAmount = validData.reduce((sum, row) => {
        let amount = 0;
        if (totalPriceCol && row[totalPriceCol]) {
          amount = this.parseAmountValue(row[totalPriceCol]) || 0;
        } else {
          const qty = this.parseAmountValue(row[quantityCol]) || 0;
          const price = this.parseAmountValue(row[priceCol]) || 0;
          amount = qty * price;
        }
        return sum + amount;
      }, 0);
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
      } else if (char === "," && !inQuotes) {
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
      const hasQuantity =
        quantityCol &&
        row[quantityCol] &&
        this.parseAmountValue(row[quantityCol]) > 0;
      const hasPrice =
        priceCol && row[priceCol] && this.parseAmountValue(row[priceCol]) > 0;

      // NEVER mark rows with quantity or price as main sections
      if (hasQuantity || hasPrice) {
        row.isMainSection = false;
        row.mainSection = currentMainSection;
      } else {
        // Only consider as main section if it's clearly a header
        const isAllCaps =
          description === description.toUpperCase() && description.length < 30;
        const startsWithNumber = /^\d+[\.\)]\s*[A-Z]/.test(description); // Number followed by capital letter
        const isVeryShort = description.length < 30;

        // Only mark as main section if it's clearly a header pattern AND has no data
        if (
          (isAllCaps || startsWithNumber) &&
          isVeryShort &&
          description.length > 0
        ) {
          currentMainSection = description;
          currentSubSection = null;
          row.isMainSection = true;
          row.mainSection = description;
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
        const hasNoQuantity =
          !quantityCol || !row[quantityCol] || row[quantityCol] === "";
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
      .replace(/[^\d.-]/g, "") // Remove all non-numeric except . and -
      .replace(/,/g, ""); // Remove commas

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
    if (!projectId || projectId.trim() === "") {
      const error =
        "❌ CRITICAL: Project ID is required when creating phases from BOQ data";

      throw new Error(error);
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Get project for dates
    const project = await this.findOne(projectId, userId);
    if (!project) {
      throw new Error(`Project with ID ${projectId} not found`);
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

    const phases: Phase[] = [];
    const daysPerPhase = totalDays / Math.max(data.length, 1);

    // STEP 4: Map clean rows → phases
    for (let i = 0; i < data.length; i++) {
      const item = data[i];

      // Validate item has required fields
      if (!item) {
        continue;
      }

      // Ensure description exists - check multiple possible field names (case-insensitive)
      // The BOQ parser returns items with lowercase 'description', but raw parsed data might have 'Description' (capital D)
      const itemDescription =
        item.description ||
        item.Description ||
        item._extractedDescription ||
        item.title ||
        item.Title ||
        (item.rawData &&
          (item.rawData.description || item.rawData.Description)) ||
        "";

      if (!itemDescription || itemDescription.trim() === "") {
        continue;
      }

      // Calculate phase dates
      const phaseStartDate = new Date(projectStartDate);
      phaseStartDate.setDate(phaseStartDate.getDate() + i * daysPerPhase);
      const phaseEndDate = new Date(phaseStartDate);
      phaseEndDate.setDate(phaseEndDate.getDate() + daysPerPhase);

      // Extract other fields - handle both lowercase and capitalized field names
      // Also handle rawData fields and numeric string conversions
      const itemUnit =
        item.unit ||
        item.Unit ||
        item._extractedUnit ||
        (item.rawData && (item.rawData.unit || item.rawData.Unit)) ||
        "";

      // Quantity can be number or string, need to parse it
      const itemQuantity =
        item.quantity !== undefined && item.quantity !== null
          ? typeof item.quantity === "number"
            ? item.quantity
            : parseFloat(String(item.quantity)) || 0
          : item.Quantity !== undefined && item.Quantity !== null
            ? typeof item.Quantity === "number"
              ? item.Quantity
              : parseFloat(String(item.Quantity)) || 0
            : item._extractedQuantity !== undefined &&
                item._extractedQuantity !== null
              ? typeof item._extractedQuantity === "number"
                ? item._extractedQuantity
                : parseFloat(String(item._extractedQuantity)) || 0
              : item.rawData && (item.rawData.quantity || item.rawData.Quantity)
                ? typeof item.rawData.quantity === "number"
                  ? item.rawData.quantity
                  : typeof item.rawData.Quantity === "number"
                    ? item.rawData.Quantity
                    : parseFloat(
                        String(
                          item.rawData.quantity || item.rawData.Quantity || 0
                        )
                      )
                : 0;

      // Rate and Amount - parse numeric values
      const itemRate =
        item.rate !== undefined && item.rate !== null
          ? typeof item.rate === "number"
            ? item.rate
            : parseFloat(String(item.rate)) || 0
          : item.Rate !== undefined && item.Rate !== null
            ? typeof item.Rate === "number"
              ? item.Rate
              : parseFloat(String(item.Rate)) || 0
            : item.rawData &&
                (item.rawData.rate ||
                  item.rawData["Rate ($)"] ||
                  item.rawData.Rate)
              ? typeof item.rawData.rate === "number"
                ? item.rawData.rate
                : typeof item.rawData["Rate ($)"] === "number"
                  ? item.rawData["Rate ($)"]
                  : typeof item.rawData.Rate === "number"
                    ? item.rawData.Rate
                    : parseFloat(
                        String(
                          item.rawData.rate ||
                            item.rawData["Rate ($)"] ||
                            item.rawData.Rate ||
                            0
                        )
                      )
              : 0;

      const itemAmount =
        item.amount !== undefined && item.amount !== null
          ? typeof item.amount === "number"
            ? item.amount
            : parseFloat(String(item.amount)) || 0
          : item.Amount !== undefined && item.Amount !== null
            ? typeof item.Amount === "number"
              ? item.Amount
              : parseFloat(String(item.Amount)) || 0
            : item.rawData &&
                (item.rawData.amount ||
                  item.rawData["Amount ($)"] ||
                  item.rawData.Amount)
              ? typeof item.rawData.amount === "number"
                ? item.rawData.amount
                : typeof item.rawData["Amount ($)"] === "number"
                  ? item.rawData["Amount ($)"]
                  : typeof item.rawData.Amount === "number"
                    ? item.rawData.Amount
                    : parseFloat(
                        String(
                          item.rawData.amount ||
                            item.rawData["Amount ($)"] ||
                            item.rawData.Amount ||
                            0
                        )
                      )
              : 0;

      const itemSection = item.section || item.Section || "";

      // Build phase description with metadata
      const phaseDescription = [
        itemSection ? `Section: ${itemSection}` : null,
        itemUnit ? `Unit: ${itemUnit}` : null,
        itemQuantity ? `Quantity: ${itemQuantity}` : null,
        itemRate > 0 ? `Rate: ${itemRate}` : null,
      ]
        .filter(Boolean)
        .join(" | ");

      // STEP 4: Create phase object
      // ⚠️ IMPORTANT: BOQ phases are created as INACTIVE (is_active = false)
      // User must explicitly activate them from the BOQ phases list
      const phaseData = {
        title: itemDescription.trim(), // Title = Description from BOQ
        description: phaseDescription, // Additional metadata
        budget: itemAmount || 0,
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
      if (!phaseData.project_id || phaseData.project_id.trim() === "") {
        const error = `❌ CRITICAL: Phase "${itemDescription}" has no projectId`;
        throw new Error(error);
      }

      // Insert phase using raw query to avoid TypeORM relation issues
      // Note: boq_type is determined by the BOQ type being processed
      const insertQuery = `
        INSERT INTO phase (
          title, description, budget, start_date, end_date, due_date, 
          progress, status, project_id, is_active, from_boq, boq_type, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
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
          null, // boq_type will be set by project-boq.service.ts
        ]);

        if (!result || result.length === 0) {
          throw new Error(`Failed to create phase: ${itemDescription}`);
        }

        // Fetch the created phase
        const savedPhase = await this.phasesRepository.findOne({
          where: { id: result[0].id },
          relations: ["project"],
        });

        if (!savedPhase) {
          throw new Error(
            `Failed to retrieve created phase: ${itemDescription}`
          );
        }

        // STEP 5: Final verification - ensure phase has correct project_id
        if (savedPhase.project_id !== projectId) {
          const error = `❌ CRITICAL: Phase "${savedPhase.title}" has incorrect project_id: ${savedPhase.project_id}, expected: ${projectId}`;

          throw new Error(error);
        }

        phases.push(savedPhase);
      } catch (error) {
        throw error;
      }
    }

    // STEP 5: Final safety net - verify ALL phases have correct project_id

    for (const phase of phases) {
      if (!phase.project_id || phase.project_id !== projectId) {
        const error = `❌ CRITICAL: Phase "${phase.title}" (${phase.id}) has incorrect project_id: ${phase.project_id}, expected: ${projectId}`;

        throw new Error(error);
      }
    }

    return phases;
  }

  // Old implementation removed - functionality moved to ProjectPhaseService and ProjectBoqService

  private async createTasksFromBoqData(
    data: any[],
    projectId: string
  ): Promise<Task[]> {
    // Get column mappings from the first row keys (CSV headers)
    const rowKeys = data.length > 0 ? Object.keys(data[0]) : [];
    const columnMappings = this.getColumnMappingsFromHeaders(rowKeys);
    const { descriptionCol, unitCol, quantityCol, priceCol } = columnMappings;

    const tasks: Task[] = [];

    for (const row of data) {
      const description = row[descriptionCol] || "";
      const unit = unitCol ? row[unitCol] || "" : "";
      const quantity = this.parseAmountValue(
        quantityCol ? row[quantityCol] : undefined
      );
      const price = this.parseAmountValue(priceCol ? row[priceCol] : undefined);

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
      }
    }

    return tasks;
  }

  // Removed orphaned broken code - functionality moved to services

  /**
   * Preview BOQ file without creating phases - returns what phases would be created
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
    return this.projectBoqService.previewBoqFile(file);
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

  // Delegate to ProjectConsultantService
  async getAllConsultantProjects(): Promise<any[]> {
    return this.projectConsultantService.getAllConsultantProjects();
  }

  async getAllConsultantProjectsPaginated(
    userId: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
    status?: string
  ): Promise<{
    items: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.projectConsultantService.getAllConsultantProjectsPaginated(
      userId,
      page,
      limit,
      search,
      status
    );
  }

  // Consultant: Get project details (consultant-facing)
  async getConsultantProjectDetails(id: string): Promise<any> {
    return this.projectConsultantService.getConsultantProjectDetails(id);
  }

  // Consultant: Get phases for a project (consultant-facing)
  async getConsultantProjectPhases(projectId: string): Promise<any[]> {
    return this.projectConsultantService.getConsultantProjectPhases(projectId);
  }

  // Consultant: Get phases for a project with pagination (consultant-facing)
  async getConsultantProjectPhasesPaginated(
    projectId: string,
    { page = 1, limit = 10 }: { page?: number; limit?: number }
  ) {
    return this.projectConsultantService.getConsultantProjectPhasesPaginated(
      projectId,
      page,
      limit
    );
  }

  /**
   * Get BOQ draft phases (inactive phases created from BOQ upload)
   * These are hidden phases that user can choose to activate
   */
  async getBoqDraftPhases(projectId: string, userId: string): Promise<any[]> {
    return this.projectPhaseService.getBoqDraftPhases(projectId, userId);
  }

  /**
   * Activate selected BOQ phases (make them visible in project)
   */
  async activateBoqPhases(
    projectId: string,
    phaseIds: string[],
    userId: string,
    linkedContractorPhaseId?: string
  ): Promise<{ activated: number; phases: Phase[] }> {
    return this.projectPhaseService.activateBoqPhases(
      projectId,
      phaseIds,
      userId,
      linkedContractorPhaseId
    );
  }

  // Consultant: Get tasks for a project (consultant-facing)
  async getConsultantProjectTasks(projectId: string): Promise<any[]> {
    return this.projectConsultantService.getConsultantProjectTasks(projectId);
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
  // Delegate to ProjectContractorService

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
    return this.projectContractorService.getProjectInventory(
      projectId,
      userId,
      options
    );
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
    return this.projectContractorService.addProjectInventoryItem(
      projectId,
      createInventoryDto,
      userId,
      pictureFile
    );
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
    return this.projectContractorService.updateProjectInventoryItem(
      projectId,
      inventoryId,
      updateData,
      userId
    );
  }

  /**
   * Delete project inventory item (contractors and sub-contractors only)
   */
  async deleteProjectInventoryItem(
    projectId: string,
    inventoryId: string,
    userId: string
  ) {
    return this.projectContractorService.deleteProjectInventoryItem(
      projectId,
      inventoryId,
      userId
    );
  }

  // ==================== INVENTORY USAGE TRACKING METHODS ====================
  // Delegate to ProjectContractorService

  /**
   * Record inventory usage (contractors and sub-contractors only)
   */
  async recordInventoryUsage(
    projectId: string,
    inventoryId: string,
    quantity: number,
    userId: string,
    phaseId?: string,
    notes?: string
  ) {
    return this.projectContractorService.recordInventoryUsage(
      projectId,
      inventoryId,
      quantity,
      userId,
      phaseId,
      notes
    );
  }

  /**
   * Get usage history for a specific inventory item
   */
  async getInventoryUsageHistory(
    projectId: string,
    inventoryId: string,
    userId: string,
    options: { page?: number; limit?: number }
  ) {
    return this.projectContractorService.getInventoryUsageHistory(
      projectId,
      inventoryId,
      userId,
      options
    );
  }

  /**
   * Get usage history for all inventory items in a project
   */
  async getProjectInventoryUsage(
    projectId: string,
    userId: string,
    options: { page?: number; limit?: number }
  ) {
    return this.projectContractorService.getProjectInventoryUsage(
      projectId,
      userId,
      options
    );
  }

  /**
   * Link an existing inventory item to a project (contractors and sub-contractors only)
   */
  async linkInventoryToProject(
    inventoryId: string,
    projectId: string,
    userId: string
  ) {
    return this.projectContractorService.linkInventoryToProject(
      inventoryId,
      projectId,
      userId
    );
  }

  /**
   * Unlink an inventory item from a project (contractors and sub-contractors only)
   */
  async unlinkInventoryFromProject(
    inventoryId: string,
    projectId: string,
    userId: string
  ) {
    return this.projectContractorService.unlinkInventoryFromProject(
      inventoryId,
      projectId,
      userId
    );
  }

  // Delegate dashboard aggregation methods to ProjectDashboardService
  async getDashboardProjectStats() {
    return this.projectDashboardService.getDashboardProjectStats();
  }

  async getDashboardPhaseStats() {
    return this.projectDashboardService.getDashboardPhaseStats();
  }

  async getDashboardTeamMembersCount() {
    return this.projectDashboardService.getDashboardTeamMembersCount();
  }

  async getDashboardMonthlyGrowth() {
    return this.projectDashboardService.getDashboardMonthlyGrowth();
  }

  async getProjectBoqs(projectId: string, userId: string) {
    // Verify user has access to project
    await this.findOne(projectId, userId);
    
    // Get user to determine role-based filtering
    const user = await this.usersService.findOne(userId);
    const userRole = user?.role?.toLowerCase();
    
    // Build where clause based on user role
    const whereClause: any = { project_id: projectId };
    
    // Filter BOQs by user role:
    // - Contractors see only contractor BOQs
    // - Sub-contractors see only sub-contractor BOQs
    // - Consultants see all BOQs
    if (userRole === 'contractor') {
      whereClause.type = 'contractor';
    } else if (userRole === 'sub_contractor') {
      whereClause.type = 'sub_contractor';
    }
    // Consultants and other roles see all BOQs (no type filter)
    
    const boqs = await this.projectBoqRepository.find({
      where: whereClause,
      order: { created_at: 'ASC' },
    });

    return boqs.map(boq => ({
      id: boq.id,
      type: boq.type,
      status: boq.status,
      fileName: boq.file_name,
      totalAmount: boq.total_amount,
      phasesCount: boq.phases_count,
      createdAt: boq.created_at,
      updatedAt: boq.updated_at,
      errorMessage: boq.error_message,
    }));
  }
}
