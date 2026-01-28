import { Repository } from "typeorm";
import { Project } from "../../entities/project.entity";
import { Phase } from "../../entities/phase.entity";
import { ContractorPhase } from "../../entities/contractor-phase.entity";
import { SubContractorPhase } from "../../entities/sub-contractor-phase.entity";
import { Inventory } from "../../entities/inventory.entity";
import { InventoryUsage } from "../../entities/inventory-usage.entity";
import { UsersService } from "../../users/users.service";
import { ActivitiesService } from "../../activities/activities.service";
import { ProjectsService } from "../projects.service";
export declare class ProjectContractorService {
    private readonly projectsRepository;
    private readonly phasesRepository;
    private readonly contractorPhasesRepository;
    private readonly subContractorPhasesRepository;
    private readonly inventoryRepository;
    private readonly inventoryUsageRepository;
    private readonly usersService;
    private readonly activitiesService;
    private readonly projectsService;
    constructor(projectsRepository: Repository<Project>, phasesRepository: Repository<Phase>, contractorPhasesRepository: Repository<ContractorPhase>, subContractorPhasesRepository: Repository<SubContractorPhase>, inventoryRepository: Repository<Inventory>, inventoryUsageRepository: Repository<InventoryUsage>, usersService: UsersService, activitiesService: ActivitiesService, projectsService: ProjectsService);
    private verifyContractorAccess;
    private verifyProjectAccess;
    getProjectPhases(projectId: string, userId: string): Promise<any[]>;
    getContractorPhasesForLinking(projectId: string, userId: string): Promise<any[]>;
    private normalizePhaseResponse;
    getProjectPhasesPaginated(projectId: string, userId: string, { page, limit }: {
        page?: number;
        limit?: number;
    }): Promise<{
        items: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getProjectInventory(projectId: string, userId: string, options: {
        page?: number;
        limit?: number;
        category?: string;
        search?: string;
    }): Promise<{
        items: Inventory[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    addProjectInventoryItem(projectId: string, createInventoryDto: any, userId: string, pictureFile?: Express.Multer.File): Promise<Inventory>;
    updateProjectInventoryItem(projectId: string, inventoryId: string, updateData: any, userId: string): Promise<Inventory>;
    deleteProjectInventoryItem(projectId: string, inventoryId: string, userId: string): Promise<{
        message: string;
    }>;
    recordInventoryUsage(projectId: string, inventoryId: string, quantity: number, userId: string, phaseId?: string, notes?: string): Promise<InventoryUsage>;
    getInventoryUsageHistory(projectId: string, inventoryId: string, userId: string, options: {
        page?: number;
        limit?: number;
    }): Promise<{
        items: InventoryUsage[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getProjectInventoryUsage(projectId: string, userId: string, options: {
        page?: number;
        limit?: number;
    }): Promise<{
        items: InventoryUsage[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    linkInventoryToProject(inventoryId: string, projectId: string, userId: string): Promise<Inventory>;
    unlinkInventoryFromProject(inventoryId: string, projectId: string, userId: string): Promise<Inventory>;
}
