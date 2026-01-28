import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  forwardRef,
  Inject,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { Project } from "../../entities/project.entity";
import { Phase } from "../../entities/phase.entity";
import { ContractorPhase } from "../../entities/contractor-phase.entity";
import { SubContractorPhase } from "../../entities/sub-contractor-phase.entity";
import { Inventory } from "../../entities/inventory.entity";
import { InventoryUsage } from "../../entities/inventory-usage.entity";
import { User, UserRole } from "../../entities/user.entity";
import { UsersService } from "../../users/users.service";
import { ActivitiesService } from "../../activities/activities.service";
import { ProjectsService } from "../projects.service";
import * as path from "path";
import * as fs from "fs";

@Injectable()
export class ProjectContractorService {
  constructor(
    @InjectRepository(Project)
    private readonly projectsRepository: Repository<Project>,
    @InjectRepository(Phase)
    private readonly phasesRepository: Repository<Phase>,
    @InjectRepository(ContractorPhase)
    private readonly contractorPhasesRepository: Repository<ContractorPhase>,
    @InjectRepository(SubContractorPhase)
    private readonly subContractorPhasesRepository: Repository<SubContractorPhase>,
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    @InjectRepository(InventoryUsage)
    private readonly inventoryUsageRepository: Repository<InventoryUsage>,
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => ActivitiesService))
    private readonly activitiesService: ActivitiesService,
    @Inject(forwardRef(() => ProjectsService))
    private readonly projectsService: ProjectsService
  ) {}

  /**
   * Check if user is contractor or sub-contractor
   */
  private async verifyContractorAccess(userId: string): Promise<User> {
    const user = await this.usersService.findOne(userId);
    if (user?.role !== UserRole.CONTRACTOR && user?.role !== UserRole.SUB_CONTRACTOR) {
      throw new ForbiddenException(
        "Only contractors and sub-contractors can perform this action"
      );
    }
    return user;
  }

  /**
   * Verify project access for contractors/sub-contractors (they can only access projects they're invited to)
   */
  private async verifyProjectAccess(projectId: string, userId: string): Promise<Project> {
    const user = await this.usersService.findOne(userId);
    const isContractor = user?.role === UserRole.CONTRACTOR;
    const isSubContractor = user?.role === UserRole.SUB_CONTRACTOR;

    if (!isContractor && !isSubContractor) {
      return this.projectsService.findOne(projectId, userId);
    } else {
      // Contractors and sub-contractors can only access projects they're invited to (owner or collaborator)
      const project = await this.projectsService.findOne(projectId, userId);
      if (!project) {
        throw new NotFoundException(`Project with ID ${projectId} not found`);
      }
      return project;
    }
  }

  /**
   * Get project phases (contractors/sub-contractors can only access projects they're invited to)
   * Filters by BOQ type based on user role and includes linked phases
   */
  async getProjectPhases(projectId: string, userId: string): Promise<any[]> {
    await this.verifyProjectAccess(projectId, userId);

    // Get user to determine role-based filtering
    const user = await this.usersService.findOne(userId);
    const userRole = user?.role?.toLowerCase();

    // Query the new separate tables based on user role
    if (userRole === 'contractor') {
      // Contractors see their phases from contractor_phases table
      const contractorPhases = await this.contractorPhasesRepository.find({
        where: { project_id: projectId, is_active: true },
        relations: ["subPhases"],
        order: { created_at: "ASC" },
      });

      // Also get linked sub-contractor phases
      const contractorPhaseIds = contractorPhases.map(p => p.id);
      const linkedSubContractorPhases = contractorPhaseIds.length > 0
        ? await this.subContractorPhasesRepository.find({
            where: { 
              project_id: projectId, 
              is_active: true,
              linkedContractorPhaseId: In(contractorPhaseIds),
            },
            relations: ["subPhases"],
            order: { created_at: "ASC" },
          })
        : [];

      // Create a map of contractor phase IDs to their linked sub-contractor phases
      const linkedPhasesMap = new Map<string, any[]>();
      linkedSubContractorPhases.forEach(subContractorPhase => {
        const contractorPhaseId = subContractorPhase.linkedContractorPhaseId;
        if (contractorPhaseId) {
          if (!linkedPhasesMap.has(contractorPhaseId)) {
            linkedPhasesMap.set(contractorPhaseId, []);
          }
          linkedPhasesMap.get(contractorPhaseId)!.push(subContractorPhase);
        }
      });

      // Also check legacy Phase table for backward compatibility
      const legacyPhases = await this.phasesRepository.find({
        where: { project_id: projectId, is_active: true, boqType: 'contractor' },
        relations: ["subPhases"],
        order: { created_at: "ASC" },
      });

      // Get legacy linked sub-contractor phases
      const legacyContractorPhaseIds = legacyPhases.map(p => p.id);
      const legacyLinkedSubContractorPhases = legacyContractorPhaseIds.length > 0
        ? await this.phasesRepository.find({
            where: { 
              project_id: projectId, 
              is_active: true,
              boqType: 'sub_contractor',
              linkedContractorPhaseId: In(legacyContractorPhaseIds),
            },
            relations: ["subPhases"],
            order: { created_at: "ASC" },
          })
        : [];

      // Add legacy linked phases to the map
      legacyLinkedSubContractorPhases.forEach(legacySubContractorPhase => {
        const contractorPhaseId = legacySubContractorPhase.linkedContractorPhaseId;
        if (contractorPhaseId) {
          if (!linkedPhasesMap.has(contractorPhaseId)) {
            linkedPhasesMap.set(contractorPhaseId, []);
          }
          linkedPhasesMap.get(contractorPhaseId)!.push(legacySubContractorPhase);
        }
      });

      // Normalize contractor phases and include linked sub-contractor phases as sub-phases
      const normalizedContractorPhases = contractorPhases.map(phase => {
        const normalized = this.normalizePhaseResponse(phase);
        // Add linked sub-contractor phases as sub-phases
        const linkedPhases = linkedPhasesMap.get(phase.id) || [];
        // Convert linked sub-contractor phases to sub-phase format
        const linkedAsSubPhases = linkedPhases.map((linkedPhase: any) => ({
          id: linkedPhase.id,
          title: linkedPhase.title || linkedPhase.name,
          description: linkedPhase.description || '',
          isCompleted: linkedPhase.status === 'completed',
          completionPercentage: linkedPhase.progress || 0,
          phaseId: phase.id,
          contractorPhaseId: phase.id,
          subContractorPhaseId: linkedPhase.id,
          isLinkedSubContractorPhase: true, // Flag to identify these as linked phases
          created_at: linkedPhase.created_at,
          updated_at: linkedPhase.updated_at,
        }));
        // Combine regular sub-phases with linked sub-contractor phases
        normalized.subPhases = [...(normalized.subPhases || []), ...linkedAsSubPhases];
        return normalized;
      });

      // Normalize legacy phases similarly
      const normalizedLegacyPhases = legacyPhases.map(phase => {
        const normalized = this.normalizePhaseResponse(phase);
        const linkedPhases = linkedPhasesMap.get(phase.id) || [];
        const linkedAsSubPhases = linkedPhases.map((linkedPhase: any) => ({
          id: linkedPhase.id,
          title: linkedPhase.title || linkedPhase.name,
          description: linkedPhase.description || '',
          isCompleted: linkedPhase.status === 'completed',
          completionPercentage: linkedPhase.progress || 0,
          phaseId: phase.id,
          contractorPhaseId: phase.id,
          subContractorPhaseId: linkedPhase.id,
          isLinkedSubContractorPhase: true,
          created_at: linkedPhase.created_at,
          updated_at: linkedPhase.updated_at,
        }));
        normalized.subPhases = [...(normalized.subPhases || []), ...linkedAsSubPhases];
        return normalized;
      });

      // Return only contractor phases (linked sub-contractor phases are now included as sub-phases)
      return [...normalizedContractorPhases, ...normalizedLegacyPhases].sort((a, b) => 
        new Date(a.created_at || a.start_date || 0).getTime() - new Date(b.created_at || b.start_date || 0).getTime()
      );
    } else if (userRole === 'sub_contractor') {
      // Sub-contractors see their phases from sub_contractor_phases table
      const subContractorPhases = await this.subContractorPhasesRepository.find({
        where: { project_id: projectId, is_active: true },
        relations: ["subPhases"],
        order: { created_at: "ASC" },
      });

      // Also get linked contractor phases
      const linkedContractorPhaseIds = subContractorPhases
        .map(p => p.linkedContractorPhaseId)
        .filter(id => id !== null && id !== undefined);

      const linkedContractorPhases = linkedContractorPhaseIds.length > 0
        ? await this.contractorPhasesRepository.find({
            where: { 
              project_id: projectId, 
              is_active: true,
              id: In(linkedContractorPhaseIds),
            },
            relations: ["subPhases"],
            order: { created_at: "ASC" },
          })
        : [];

      // Create a map of contractor phase IDs to their details for quick lookup
      const contractorPhaseMap = new Map(
        linkedContractorPhases.map(cp => [cp.id, { id: cp.id, title: cp.title, name: cp.title }])
      );

      // Also check legacy Phase table for backward compatibility
      const legacyPhases = await this.phasesRepository.find({
        where: { project_id: projectId, is_active: true, boqType: 'sub_contractor' },
        relations: ["subPhases"],
        order: { created_at: "ASC" },
      });

      // Add legacy contractor phases to the map
      const legacyContractorPhases = await this.phasesRepository.find({
        where: { 
          project_id: projectId, 
          is_active: true, 
          boqType: 'contractor',
          id: In(linkedContractorPhaseIds),
        },
        relations: ["subPhases"],
      });
      legacyContractorPhases.forEach(cp => {
        if (!contractorPhaseMap.has(cp.id)) {
          contractorPhaseMap.set(cp.id, { id: cp.id, title: cp.title, name: cp.title });
        }
      });

      // Combine and normalize to Phase format, including linked contractor phase info
      const allPhases = [...subContractorPhases, ...linkedContractorPhases, ...legacyPhases];
      return allPhases.map(phase => {
        const normalized = this.normalizePhaseResponse(phase);
        // Add linked contractor phase details if this phase is linked
        if (normalized.linkedContractorPhaseId) {
          const linkedPhase = contractorPhaseMap.get(normalized.linkedContractorPhaseId);
          if (linkedPhase) {
            normalized.linkedContractorPhase = {
              id: linkedPhase.id,
              title: linkedPhase.title,
              name: linkedPhase.name,
            };
          }
        }
        return normalized;
      }).sort((a, b) => 
        new Date(a.created_at || a.start_date || 0).getTime() - new Date(b.created_at || b.start_date || 0).getTime()
      );
    } else {
      // Consultants and other roles see all phases from both tables
      const contractorPhases = await this.contractorPhasesRepository.find({
        where: { project_id: projectId, is_active: true },
        relations: ["subPhases"],
        order: { created_at: "ASC" },
      });

      const subContractorPhases = await this.subContractorPhasesRepository.find({
        where: { project_id: projectId, is_active: true },
        relations: ["subPhases"],
        order: { created_at: "ASC" },
      });

      const legacyPhases = await this.phasesRepository.find({
      where: { project_id: projectId, is_active: true },
        relations: ["subPhases"],
        order: { created_at: "ASC" },
      });

      const allPhases = [...contractorPhases, ...subContractorPhases, ...legacyPhases];
      return allPhases.map(phase => this.normalizePhaseResponse(phase)).sort((a, b) => 
        new Date(a.created_at || a.start_date || 0).getTime() - new Date(b.created_at || b.start_date || 0).getTime()
      );
    }
  }

  /**
   * Get contractor phases for sub-contractors to link to
   * Returns only active contractor phases that sub-contractors can link their phases to
   */
  async getContractorPhasesForLinking(projectId: string, userId: string): Promise<any[]> {
    await this.verifyProjectAccess(projectId, userId);

    // Get user to verify they are a sub-contractor
    const user = await this.usersService.findOne(userId);
    const userRole = user?.role?.toLowerCase();

    if (userRole !== 'sub_contractor') {
      throw new ForbiddenException("Only sub-contractors can access contractor phases for linking");
    }

    // Get only active contractor phases that are currently being worked on (not completed)
    // Sub-contractors should only link to phases that are in progress or not started
    const contractorPhases = await this.contractorPhasesRepository.find({
      where: { 
        project_id: projectId, 
        is_active: true,
        status: In(['not_started', 'in_progress', 'delayed'])
      },
      relations: ["subPhases"],
      order: { created_at: "ASC" },
    });

    // Also get contractor phases from legacy Phase table (only active, not completed)
    const legacyContractorPhases = await this.phasesRepository.find({
      where: { 
        project_id: projectId, 
        is_active: true, 
        boqType: 'contractor',
        status: In(['not_started', 'in_progress', 'delayed'])
      },
      relations: ["subPhases"],
      order: { created_at: "ASC" },
    });

    // Combine and normalize
    const allPhases = [...contractorPhases, ...legacyContractorPhases];
    return allPhases.map(phase => this.normalizePhaseResponse(phase)).sort((a, b) => 
      new Date(a.created_at || a.start_date || 0).getTime() - new Date(b.created_at || b.start_date || 0).getTime()
    );
  }

  // Helper method to normalize phase response to match Phase interface
  private normalizePhaseResponse(phase: any): any {
    return {
      id: phase.id,
      name: phase.title,
      title: phase.title,
      description: phase.description,
      status: phase.status,
      budget: phase.budget,
      progress: phase.progress,
      startDate: phase.start_date,
      start_date: phase.start_date,
      endDate: phase.end_date,
      end_date: phase.end_date,
      subPhases: phase.subPhases || [],
      created_at: phase.created_at,
      updated_at: phase.updated_at,
      // Include linking information for display
      linkedContractorPhaseId: phase.linkedContractorPhaseId || phase.linked_contractor_phase_id || null,
      isLinkedPhase: !!(phase.linkedContractorPhaseId || phase.linked_contractor_phase_id),
      // For contractor phases, include info about linked sub-contractor phases
      hasLinkedSubContractorPhases: phase.linkedSubContractorPhases?.length > 0 || false,
    };
  }

  /**
   * Get paginated project phases (contractors/sub-contractors can only access projects they're invited to)
   * Filters by BOQ type based on user role and includes linked phases
   */
  async getProjectPhasesPaginated(
    projectId: string,
    userId: string,
    { page = 1, limit = 10 }: { page?: number; limit?: number }
  ) {
    await this.verifyProjectAccess(projectId, userId);

    // Get user to determine role-based filtering
    const user = await this.usersService.findOne(userId);
    const userRole = user?.role?.toLowerCase();

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    // Get all phases first (with role-based filtering) from new separate tables
    let allPhases: any[] = [];
    let contractorPhaseMap: Map<string, { id: string; title: string; name: string }> | null = null;
    
    if (userRole === 'contractor') {
      // Contractors see their phases from contractor_phases table
      const contractorPhases = await this.contractorPhasesRepository.find({
        where: { project_id: projectId, is_active: true },
        relations: ["subPhases"],
        order: { created_at: "ASC" },
      });

      const contractorPhaseIds = contractorPhases.map(p => p.id);
      const linkedSubContractorPhases = contractorPhaseIds.length > 0
        ? await this.subContractorPhasesRepository.find({
            where: { 
              project_id: projectId, 
              is_active: true,
              linkedContractorPhaseId: In(contractorPhaseIds),
            },
            relations: ["subPhases"],
            order: { created_at: "ASC" },
          })
        : [];

      // Create a map of contractor phase IDs to their linked sub-contractor phases
      const linkedPhasesMap = new Map<string, any[]>();
      linkedSubContractorPhases.forEach(subContractorPhase => {
        const contractorPhaseId = subContractorPhase.linkedContractorPhaseId;
        if (contractorPhaseId) {
          if (!linkedPhasesMap.has(contractorPhaseId)) {
            linkedPhasesMap.set(contractorPhaseId, []);
          }
          linkedPhasesMap.get(contractorPhaseId)!.push(subContractorPhase);
        }
      });

      // Create a map of contractor phase IDs to their details for linked sub-contractor phases
      contractorPhaseMap = new Map(
        contractorPhases.map(cp => [cp.id, { id: cp.id, title: cp.title, name: cp.title }])
      );

      // Also check legacy Phase table
      const legacyPhases = await this.phasesRepository.find({
        where: { project_id: projectId, is_active: true, boqType: 'contractor' },
        relations: ["subPhases"],
        order: { created_at: "ASC" },
      });

      // Get legacy linked sub-contractor phases
      const legacyContractorPhaseIds = legacyPhases.map(p => p.id);
      const legacyLinkedSubContractorPhases = legacyContractorPhaseIds.length > 0
        ? await this.phasesRepository.find({
            where: { 
              project_id: projectId, 
              is_active: true,
              boqType: 'sub_contractor',
              linkedContractorPhaseId: In(legacyContractorPhaseIds),
            },
            relations: ["subPhases"],
            order: { created_at: "ASC" },
          })
        : [];

      // Add legacy linked phases to the map
      legacyLinkedSubContractorPhases.forEach(legacySubContractorPhase => {
        const contractorPhaseId = legacySubContractorPhase.linkedContractorPhaseId;
        if (contractorPhaseId) {
          if (!linkedPhasesMap.has(contractorPhaseId)) {
            linkedPhasesMap.set(contractorPhaseId, []);
          }
          linkedPhasesMap.get(contractorPhaseId)!.push(legacySubContractorPhase);
        }
      });

      // Add legacy contractor phases to the map
      legacyPhases.forEach(cp => {
        if (!contractorPhaseMap.has(cp.id)) {
          contractorPhaseMap.set(cp.id, { id: cp.id, title: cp.title, name: cp.title });
        }
      });

      // Normalize contractor phases and include linked sub-contractor phases as sub-phases
      const normalizedContractorPhases = contractorPhases.map(phase => {
        const normalized = this.normalizePhaseResponse(phase);
        const linkedPhases = linkedPhasesMap.get(phase.id) || [];
        const linkedAsSubPhases = linkedPhases.map((linkedPhase: any) => ({
          id: linkedPhase.id,
          title: linkedPhase.title || linkedPhase.name,
          description: linkedPhase.description || '',
          isCompleted: linkedPhase.status === 'completed',
          completionPercentage: linkedPhase.progress || 0,
          phaseId: phase.id,
          contractorPhaseId: phase.id,
          subContractorPhaseId: linkedPhase.id,
          isLinkedSubContractorPhase: true,
          created_at: linkedPhase.created_at,
          updated_at: linkedPhase.updated_at,
        }));
        normalized.subPhases = [...(normalized.subPhases || []), ...linkedAsSubPhases];
        return normalized;
      });

      // Normalize legacy phases similarly
      const normalizedLegacyPhases = legacyPhases.map(phase => {
        const normalized = this.normalizePhaseResponse(phase);
        const linkedPhases = linkedPhasesMap.get(phase.id) || [];
        const linkedAsSubPhases = linkedPhases.map((linkedPhase: any) => ({
          id: linkedPhase.id,
          title: linkedPhase.title || linkedPhase.name,
          description: linkedPhase.description || '',
          isCompleted: linkedPhase.status === 'completed',
          completionPercentage: linkedPhase.progress || 0,
          phaseId: phase.id,
          contractorPhaseId: phase.id,
          subContractorPhaseId: linkedPhase.id,
          isLinkedSubContractorPhase: true,
          created_at: linkedPhase.created_at,
          updated_at: linkedPhase.updated_at,
        }));
        normalized.subPhases = [...(normalized.subPhases || []), ...linkedAsSubPhases];
        return normalized;
      });

      // Return only contractor phases (linked sub-contractor phases are now included as sub-phases)
      allPhases = [...normalizedContractorPhases, ...normalizedLegacyPhases];
    } else if (userRole === 'sub_contractor') {
      // Sub-contractors see their phases from sub_contractor_phases table
      const subContractorPhases = await this.subContractorPhasesRepository.find({
        where: { project_id: projectId, is_active: true },
        relations: ["subPhases"],
        order: { created_at: "ASC" },
      });

      const linkedContractorPhaseIds = subContractorPhases
        .map(p => p.linkedContractorPhaseId)
        .filter(id => id !== null && id !== undefined);

      const linkedContractorPhases = linkedContractorPhaseIds.length > 0
        ? await this.contractorPhasesRepository.find({
            where: { 
              project_id: projectId, 
              is_active: true,
              id: In(linkedContractorPhaseIds),
            },
            relations: ["subPhases"],
            order: { created_at: "ASC" },
          })
        : [];

      // Create a map of contractor phase IDs to their details for quick lookup
      contractorPhaseMap = new Map(
        linkedContractorPhases.map(cp => [cp.id, { id: cp.id, title: cp.title, name: cp.title }])
      );

      // Also check legacy Phase table
      const legacyPhases = await this.phasesRepository.find({
        where: { project_id: projectId, is_active: true, boqType: 'sub_contractor' },
        relations: ["subPhases"],
        order: { created_at: "ASC" },
      });

      // Add legacy contractor phases to the map
      const legacyContractorPhases = await this.phasesRepository.find({
        where: { 
          project_id: projectId, 
          is_active: true, 
          boqType: 'contractor',
          id: In(linkedContractorPhaseIds),
        },
        relations: ["subPhases"],
      });
      legacyContractorPhases.forEach(cp => {
        if (contractorPhaseMap && !contractorPhaseMap.has(cp.id)) {
          contractorPhaseMap.set(cp.id, { id: cp.id, title: cp.title, name: cp.title });
        }
      });

      allPhases = [...subContractorPhases, ...linkedContractorPhases, ...legacyPhases];
    } else {
      // Consultants and other roles see all phases from both tables
      const contractorPhases = await this.contractorPhasesRepository.find({
        where: { project_id: projectId, is_active: true },
        relations: ["subPhases"],
        order: { created_at: "ASC" },
      });

      const subContractorPhases = await this.subContractorPhasesRepository.find({
        where: { project_id: projectId, is_active: true },
        relations: ["subPhases"],
        order: { created_at: "ASC" },
      });

      const legacyPhases = await this.phasesRepository.find({
      where: { project_id: projectId, is_active: true },
        relations: ["subPhases"],
      order: { created_at: "ASC" },
      });

      allPhases = [...contractorPhases, ...subContractorPhases, ...legacyPhases];
    }

    // Normalize phases to match Phase interface, including linked contractor phase info
    const normalizedPhases = allPhases.map(phase => {
      const normalized = this.normalizePhaseResponse(phase);
      // For sub-contractor phases, add linked contractor phase details
      if (userRole === 'sub_contractor' && normalized.linkedContractorPhaseId && contractorPhaseMap) {
        const linkedPhase = contractorPhaseMap.get(normalized.linkedContractorPhaseId);
        if (linkedPhase) {
          normalized.linkedContractorPhase = {
            id: linkedPhase.id,
            title: linkedPhase.title,
            name: linkedPhase.name,
          };
        }
      }
      // For contractor phases, add linked contractor phase details for linked sub-contractor phases
      if (userRole === 'contractor' && normalized.isLinkedPhase && normalized.linkedContractorPhaseId && contractorPhaseMap) {
        const linkedPhase = contractorPhaseMap.get(normalized.linkedContractorPhaseId);
        if (linkedPhase) {
          normalized.linkedContractorPhase = {
            id: linkedPhase.id,
            title: linkedPhase.title,
            name: linkedPhase.name,
          };
        }
      }
      return normalized;
    });
    
    // Sort by creation date
    normalizedPhases.sort((a, b) => 
      new Date(a.created_at || a.start_date || 0).getTime() - new Date(b.created_at || b.start_date || 0).getTime()
    );

    // Apply pagination
    const total = normalizedPhases.length;
    const paginatedItems = normalizedPhases.slice(
      (pageNum - 1) * limitNum,
      pageNum * limitNum
    );

    return {
      items: paginatedItems,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

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
    await this.verifyProjectAccess(projectId, userId);

    const { page = 1, limit = 10, category, search } = options;
    const skip = (page - 1) * limit;

    const queryBuilder = this.inventoryRepository
      .createQueryBuilder("inventory")
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
    const user = await this.verifyContractorAccess(userId);

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

    const saved = (await this.inventoryRepository.save(inventory)) as unknown as Inventory;

    // Log activity
    await this.activitiesService.logInventoryAdded(
      user,
      project,
      saved.name,
      {
        category: saved.category,
        quantity: saved.quantity_available,
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
    const user = await this.verifyContractorAccess(userId);

    const project = await this.projectsRepository.findOne({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    const inventory = await this.inventoryRepository.findOne({
      where: { id: inventoryId, project_id: projectId },
    });

    if (!inventory) {
      throw new NotFoundException(`Inventory item not found in this project`);
    }

    Object.assign(inventory, updateData);
    const updated = await this.inventoryRepository.save(inventory);

    // Log activity
    await this.activitiesService.logInventoryUpdated(user, project, updated.name);

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
    const user = await this.verifyContractorAccess(userId);

    const project = await this.projectsRepository.findOne({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    const inventory = await this.inventoryRepository.findOne({
      where: { id: inventoryId, project_id: projectId },
    });

    if (!inventory) {
      throw new NotFoundException(`Inventory item not found in this project`);
    }

    const inventoryName = inventory.name;
    await this.inventoryRepository.remove(inventory);

    // Log activity
    await this.activitiesService.logInventoryDeleted(user, project, inventoryName);

    return { message: "Inventory item deleted successfully" };
  }

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
    const user = await this.verifyContractorAccess(userId);

    const project = await this.projectsRepository.findOne({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    const inventory = await this.inventoryRepository.findOne({
      where: { id: inventoryId, project_id: projectId },
    });

    if (!inventory) {
      throw new NotFoundException(`Inventory item not found in this project`);
    }

    // Validate quantity
    if (quantity <= 0) {
      throw new BadRequestException("Quantity used must be greater than 0");
    }

    if (quantity > inventory.quantity_available) {
      throw new BadRequestException(
        `Cannot use more than available quantity (${inventory.quantity_available} ${inventory.unit})`
      );
    }

    // Verify phase if provided
    if (phaseId) {
      const phase = await this.phasesRepository.findOne({
        where: { id: phaseId, project_id: projectId },
      });
      if (!phase) {
        throw new NotFoundException(`Phase not found in this project`);
      }
    }

    // Create usage record
    const usage = this.inventoryUsageRepository.create({
      inventory_id: inventoryId,
      project_id: projectId,
      quantity_used: quantity,
      phase_id: phaseId,
      notes,
      used_by: userId,
      used_at: new Date(),
    });

    const savedUsage = await this.inventoryUsageRepository.save(usage);

    // Update inventory quantities
    inventory.quantity_available = Math.max(0, inventory.quantity_available - quantity);
    inventory.quantity_used = (inventory.quantity_used || 0) + quantity;
    await this.inventoryRepository.save(inventory);

    // Log activity
    await this.activitiesService.logInventoryUpdated(
      user,
      project,
      inventory.name,
      {
        quantityUsed: quantity,
        remainingQuantity: inventory.quantity_available,
      }
    );

    return savedUsage;
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
    await this.verifyProjectAccess(projectId, userId);

    const inventory = await this.inventoryRepository.findOne({
      where: { id: inventoryId, project_id: projectId },
    });

    if (!inventory) {
      throw new NotFoundException(`Inventory item not found in this project`);
    }

    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const [items, total] = await this.inventoryUsageRepository.findAndCount({
      where: { inventory_id: inventoryId, project_id: projectId },
      relations: ["user", "phase", "inventory"],
      order: { used_at: "DESC" },
      skip,
      take: limit,
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get usage history for all inventory items in a project
   */
  async getProjectInventoryUsage(
    projectId: string,
    userId: string,
    options: { page?: number; limit?: number }
  ) {
    await this.verifyProjectAccess(projectId, userId);

    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const [items, total] = await this.inventoryUsageRepository.findAndCount({
      where: { project_id: projectId },
      relations: ["user", "phase", "inventory"],
      order: { used_at: "DESC" },
      skip,
      take: limit,
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Link an existing inventory item to a project (contractors and sub-contractors only)
   */
  async linkInventoryToProject(
    inventoryId: string,
    projectId: string,
    userId: string
  ) {
    const user = await this.verifyContractorAccess(userId);

    // Verify project exists and user has access
    const project = await this.projectsRepository.findOne({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    // Verify inventory item exists
    const inventory = await this.inventoryRepository.findOne({
      where: { id: inventoryId },
    });
    if (!inventory) {
      throw new NotFoundException(`Inventory item with ID ${inventoryId} not found`);
    }

    // Check if inventory is already linked to this project
    if (inventory.project_id === projectId) {
      return inventory; // Already linked
    }

    // Link inventory to project
    inventory.project_id = projectId;
    const updated = await this.inventoryRepository.save(inventory);

    // Log activity
    await this.activitiesService.logInventoryUpdated(
      user,
      project,
      inventory.name,
      {
        action: "linked_to_project",
        projectName: project.title,
      }
    );

    return updated;
  }

  /**
   * Unlink an inventory item from a project (contractors and sub-contractors only)
   */
  async unlinkInventoryFromProject(
    inventoryId: string,
    projectId: string,
    userId: string
  ) {
    const user = await this.verifyContractorAccess(userId);

    // Verify project exists
    const project = await this.projectsRepository.findOne({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    // Verify inventory item exists and is linked to this project
    const inventory = await this.inventoryRepository.findOne({
      where: { id: inventoryId, project_id: projectId },
    });
    if (!inventory) {
      throw new NotFoundException(
        `Inventory item not found or not linked to this project`
      );
    }

    // Unlink inventory from project
    inventory.project_id = null;
    const updated = await this.inventoryRepository.save(inventory);

    // Log activity
    await this.activitiesService.logInventoryUpdated(
      user,
      project,
      inventory.name,
      {
        action: "unlinked_from_project",
        projectName: project.title,
      }
    );

    return updated;
  }
}

