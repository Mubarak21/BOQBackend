"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectContractorService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const project_entity_1 = require("../../entities/project.entity");
const phase_entity_1 = require("../../entities/phase.entity");
const inventory_entity_1 = require("../../entities/inventory.entity");
const inventory_usage_entity_1 = require("../../entities/inventory-usage.entity");
const user_entity_1 = require("../../entities/user.entity");
const users_service_1 = require("../../users/users.service");
const activities_service_1 = require("../../activities/activities.service");
const projects_service_1 = require("../projects.service");
const path = require("path");
const fs = require("fs");
let ProjectContractorService = class ProjectContractorService {
    constructor(projectsRepository, phasesRepository, inventoryRepository, inventoryUsageRepository, usersService, activitiesService, projectsService) {
        this.projectsRepository = projectsRepository;
        this.phasesRepository = phasesRepository;
        this.inventoryRepository = inventoryRepository;
        this.inventoryUsageRepository = inventoryUsageRepository;
        this.usersService = usersService;
        this.activitiesService = activitiesService;
        this.projectsService = projectsService;
    }
    async verifyContractorAccess(userId) {
        const user = await this.usersService.findOne(userId);
        if (user?.role !== user_entity_1.UserRole.CONTRACTOR && user?.role !== user_entity_1.UserRole.SUB_CONTRACTOR) {
            throw new common_1.ForbiddenException("Only contractors and sub-contractors can perform this action");
        }
        return user;
    }
    async verifyProjectAccess(projectId, userId) {
        const user = await this.usersService.findOne(userId);
        const isContractor = user?.role === user_entity_1.UserRole.CONTRACTOR;
        const isSubContractor = user?.role === user_entity_1.UserRole.SUB_CONTRACTOR;
        if (!isContractor && !isSubContractor) {
            return this.projectsService.findOne(projectId, userId);
        }
        else {
            const project = await this.projectsRepository.findOne({
                where: { id: projectId },
            });
            if (!project) {
                throw new common_1.NotFoundException(`Project with ID ${projectId} not found`);
            }
            return project;
        }
    }
    async getProjectPhases(projectId, userId) {
        await this.verifyProjectAccess(projectId, userId);
        return this.phasesRepository.find({
            where: { project_id: projectId, is_active: true },
            relations: ["subPhases", "subPhases.subPhases"],
            order: { created_at: "ASC" },
        });
    }
    async getProjectPhasesPaginated(projectId, userId, { page = 1, limit = 10 }) {
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
    async getProjectInventory(projectId, userId, options) {
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
            queryBuilder.andWhere("(inventory.name ILIKE :search OR inventory.description ILIKE :search OR inventory.sku ILIKE :search)", { search: `%${search}%` });
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
    async addProjectInventoryItem(projectId, createInventoryDto, userId, pictureFile) {
        const user = await this.verifyContractorAccess(userId);
        const project = await this.projectsRepository.findOne({
            where: { id: projectId },
        });
        if (!project) {
            throw new common_1.NotFoundException(`Project with ID ${projectId} not found`);
        }
        let pictureUrl = null;
        if (pictureFile) {
            const uploadDir = path.join(process.cwd(), "uploads", "inventory", "pictures");
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            const fileName = `${Date.now()}-${pictureFile.originalname.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
            const filePath = path.join(uploadDir, fileName);
            fs.writeFileSync(filePath, pictureFile.buffer);
            pictureUrl = `/uploads/inventory/pictures/${fileName}`;
        }
        else {
            throw new common_1.BadRequestException("Picture evidence is required");
        }
        const inventory = this.inventoryRepository.create({
            ...createInventoryDto,
            project_id: projectId,
            picture_url: pictureUrl,
            created_by: userId,
        });
        const saved = (await this.inventoryRepository.save(inventory));
        await this.activitiesService.logInventoryAdded(user, project, saved.name, {
            category: saved.category,
            quantity: saved.quantity_available,
        });
        return saved;
    }
    async updateProjectInventoryItem(projectId, inventoryId, updateData, userId) {
        const user = await this.verifyContractorAccess(userId);
        const project = await this.projectsRepository.findOne({
            where: { id: projectId },
        });
        if (!project) {
            throw new common_1.NotFoundException(`Project with ID ${projectId} not found`);
        }
        const inventory = await this.inventoryRepository.findOne({
            where: { id: inventoryId, project_id: projectId },
        });
        if (!inventory) {
            throw new common_1.NotFoundException(`Inventory item not found in this project`);
        }
        Object.assign(inventory, updateData);
        const updated = await this.inventoryRepository.save(inventory);
        await this.activitiesService.logInventoryUpdated(user, project, updated.name);
        return updated;
    }
    async deleteProjectInventoryItem(projectId, inventoryId, userId) {
        const user = await this.verifyContractorAccess(userId);
        const project = await this.projectsRepository.findOne({
            where: { id: projectId },
        });
        if (!project) {
            throw new common_1.NotFoundException(`Project with ID ${projectId} not found`);
        }
        const inventory = await this.inventoryRepository.findOne({
            where: { id: inventoryId, project_id: projectId },
        });
        if (!inventory) {
            throw new common_1.NotFoundException(`Inventory item not found in this project`);
        }
        const inventoryName = inventory.name;
        await this.inventoryRepository.remove(inventory);
        await this.activitiesService.logInventoryDeleted(user, project, inventoryName);
        return { message: "Inventory item deleted successfully" };
    }
    async recordInventoryUsage(projectId, inventoryId, quantity, userId, phaseId, notes) {
        const user = await this.verifyContractorAccess(userId);
        const project = await this.projectsRepository.findOne({
            where: { id: projectId },
        });
        if (!project) {
            throw new common_1.NotFoundException(`Project with ID ${projectId} not found`);
        }
        const inventory = await this.inventoryRepository.findOne({
            where: { id: inventoryId, project_id: projectId },
        });
        if (!inventory) {
            throw new common_1.NotFoundException(`Inventory item not found in this project`);
        }
        if (quantity <= 0) {
            throw new common_1.BadRequestException("Quantity used must be greater than 0");
        }
        if (quantity > inventory.quantity_available) {
            throw new common_1.BadRequestException(`Cannot use more than available quantity (${inventory.quantity_available} ${inventory.unit})`);
        }
        if (phaseId) {
            const phase = await this.phasesRepository.findOne({
                where: { id: phaseId, project_id: projectId },
            });
            if (!phase) {
                throw new common_1.NotFoundException(`Phase not found in this project`);
            }
        }
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
        inventory.quantity_available = Math.max(0, inventory.quantity_available - quantity);
        inventory.quantity_used = (inventory.quantity_used || 0) + quantity;
        await this.inventoryRepository.save(inventory);
        await this.activitiesService.logInventoryUpdated(user, project, inventory.name, {
            quantityUsed: quantity,
            remainingQuantity: inventory.quantity_available,
        });
        return savedUsage;
    }
    async getInventoryUsageHistory(projectId, inventoryId, userId, options) {
        await this.verifyProjectAccess(projectId, userId);
        const inventory = await this.inventoryRepository.findOne({
            where: { id: inventoryId, project_id: projectId },
        });
        if (!inventory) {
            throw new common_1.NotFoundException(`Inventory item not found in this project`);
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
    async getProjectInventoryUsage(projectId, userId, options) {
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
    async linkInventoryToProject(inventoryId, projectId, userId) {
        const user = await this.verifyContractorAccess(userId);
        const project = await this.projectsRepository.findOne({
            where: { id: projectId },
        });
        if (!project) {
            throw new common_1.NotFoundException(`Project with ID ${projectId} not found`);
        }
        const inventory = await this.inventoryRepository.findOne({
            where: { id: inventoryId },
        });
        if (!inventory) {
            throw new common_1.NotFoundException(`Inventory item with ID ${inventoryId} not found`);
        }
        if (inventory.project_id === projectId) {
            return inventory;
        }
        inventory.project_id = projectId;
        const updated = await this.inventoryRepository.save(inventory);
        await this.activitiesService.logInventoryUpdated(user, project, inventory.name, {
            action: "linked_to_project",
            projectName: project.title,
        });
        return updated;
    }
    async unlinkInventoryFromProject(inventoryId, projectId, userId) {
        const user = await this.verifyContractorAccess(userId);
        const project = await this.projectsRepository.findOne({
            where: { id: projectId },
        });
        if (!project) {
            throw new common_1.NotFoundException(`Project with ID ${projectId} not found`);
        }
        const inventory = await this.inventoryRepository.findOne({
            where: { id: inventoryId, project_id: projectId },
        });
        if (!inventory) {
            throw new common_1.NotFoundException(`Inventory item not found or not linked to this project`);
        }
        inventory.project_id = null;
        const updated = await this.inventoryRepository.save(inventory);
        await this.activitiesService.logInventoryUpdated(user, project, inventory.name, {
            action: "unlinked_from_project",
            projectName: project.title,
        });
        return updated;
    }
};
exports.ProjectContractorService = ProjectContractorService;
exports.ProjectContractorService = ProjectContractorService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __param(1, (0, typeorm_1.InjectRepository)(phase_entity_1.Phase)),
    __param(2, (0, typeorm_1.InjectRepository)(inventory_entity_1.Inventory)),
    __param(3, (0, typeorm_1.InjectRepository)(inventory_usage_entity_1.InventoryUsage)),
    __param(5, (0, common_1.Inject)((0, common_1.forwardRef)(() => activities_service_1.ActivitiesService))),
    __param(6, (0, common_1.Inject)((0, common_1.forwardRef)(() => projects_service_1.ProjectsService))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        users_service_1.UsersService,
        activities_service_1.ActivitiesService,
        projects_service_1.ProjectsService])
], ProjectContractorService);
//# sourceMappingURL=project-contractor.service.js.map