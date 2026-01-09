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
import { Project } from "../../entities/project.entity";
import { Phase } from "../../entities/phase.entity";
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
   * Verify project access for contractors/sub-contractors (they can access all projects)
   */
  private async verifyProjectAccess(projectId: string, userId: string): Promise<Project> {
    const user = await this.usersService.findOne(userId);
    const isContractor = user?.role === UserRole.CONTRACTOR;
    const isSubContractor = user?.role === UserRole.SUB_CONTRACTOR;

    if (!isContractor && !isSubContractor) {
      return this.projectsService.findOne(projectId, userId);
    } else {
      const project = await this.projectsRepository.findOne({
        where: { id: projectId },
      });
      if (!project) {
        throw new NotFoundException(`Project with ID ${projectId} not found`);
      }
      return project;
    }
  }

  /**
   * Get project phases (contractors/sub-contractors can access all projects)
   */
  async getProjectPhases(projectId: string, userId: string): Promise<Phase[]> {
    await this.verifyProjectAccess(projectId, userId);

    return this.phasesRepository.find({
      where: { project_id: projectId, is_active: true },
      relations: ["subPhases", "subPhases.subPhases"],
      order: { created_at: "ASC" },
    });
  }

  /**
   * Get paginated project phases (contractors/sub-contractors can access all projects)
   */
  async getProjectPhasesPaginated(
    projectId: string,
    userId: string,
    { page = 1, limit = 10 }: { page?: number; limit?: number }
  ) {
    await this.verifyProjectAccess(projectId, userId);

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    const [phases, total] = await this.phasesRepository.findAndCount({
      where: { project_id: projectId, is_active: true },
      relations: ["subPhases", "subPhases.subPhases"],
      order: { created_at: "ASC" },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    });

    return {
      items: phases,
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

