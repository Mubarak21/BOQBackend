import { Repository } from "typeorm";
import { ProjectsService, ProcessBoqResult } from "./projects.service";
import { CreateProjectDto } from "./dto/create-project.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";
import { UsersService } from "../users/users.service";
import { RequestWithUser } from "../auth/interfaces/request-with-user.interface";
import { CreatePhaseDto } from "./dto/create-phase.dto";
import { UpdatePhaseDto } from "./dto/update-phase.dto";
import { Phase } from "../entities/phase.entity";
import { ComplaintsService } from "../complaints-penalties/complaints.service";
import { PenaltiesService } from "../complaints-penalties/penalties.service";
import { EvidenceService } from "./evidence.service";
import { BoqParserService } from "./boq-parser.service";
import { BoqProgressGateway } from "./boq-progress.gateway";
import { CollaborationRequest } from "../entities/collaboration-request.entity";
import { EmailService } from "./email.service";
import { ProjectBoqService } from "./services/project-boq.service";
export declare class ProjectsController {
    private readonly projectsService;
    private readonly usersService;
    private readonly complaintsService;
    private readonly penaltiesService;
    private readonly evidenceService;
    private readonly boqParserService;
    private readonly boqProgressGateway;
    private readonly emailService;
    private readonly projectBoqService;
    private readonly collaborationRequestRepository;
    constructor(projectsService: ProjectsService, usersService: UsersService, complaintsService: ComplaintsService, penaltiesService: PenaltiesService, evidenceService: EvidenceService, boqParserService: BoqParserService, boqProgressGateway: BoqProgressGateway, emailService: EmailService, projectBoqService: ProjectBoqService, collaborationRequestRepository: Repository<CollaborationRequest>);
    create(createProjectDto: CreateProjectDto, req: any): Promise<import("../entities/project.entity").Project>;
    findAll(req: RequestWithUser, page?: number, limit?: number, search?: string, status?: string): Promise<{
        items: any[];
        total: any;
        page: any;
        limit: any;
        totalPages: any;
    }>;
    getAvailableAssignees(req: any): Promise<import("../entities/user.entity").User[]>;
    findOne(id: string, req: RequestWithUser): Promise<any>;
    update(id: string, updateProjectDto: UpdateProjectDto, req: any): Promise<import("../entities/project.entity").Project>;
    remove(id: string, req: any): Promise<void>;
    inviteCollaborator(id: string, body: {
        userId?: string;
        email?: string;
        role?: string;
        companyName?: string;
    }, req: any): Promise<{
        message: string;
    }>;
    addCollaborator(id: string, userId: string, req: any): Promise<import("../entities/project.entity").Project>;
    removeCollaborator(id: string, userId: string, req: any): Promise<import("../entities/project.entity").Project>;
    previewBoq(file: Express.Multer.File, req: RequestWithUser, roomId?: string): Promise<{
        items: import("./boq-parser.service").BOQItem[];
        totalAmount: number;
        sections: string[];
        uncertainHeaders: string[];
        metadata: {
            totalRows: number;
            processedRows: number;
            skippedRows: number;
            fileType: string;
        };
        gridData: {
            id: string;
            description: string;
            quantity: number;
            unit: string;
            rate: number;
            amount: number;
            section: string;
            subSection: string;
            rowIndex: number;
        }[];
    }>;
    uploadBoq(id: string, file: Express.Multer.File, req: RequestWithUser, roomId?: string, type?: string): Promise<ProcessBoqResult>;
    getProjectBoqs(id: string, req: RequestWithUser): Promise<{
        id: string;
        type: import("../entities/project-boq.entity").BOQType;
        status: import("../entities/project-boq.entity").BOQStatus;
        fileName: string;
        totalAmount: number;
        phasesCount: number;
        createdAt: Date;
        updatedAt: Date;
        errorMessage: string;
    }[]>;
    getMissingBoqItems(id: string, req: RequestWithUser, type?: 'contractor' | 'sub_contractor'): Promise<{
        items: Array<{
            description: string;
            unit: string;
            quantity: number;
            rate: number;
            amount: number;
            section?: string;
            subSection?: string;
            rowIndex: number;
        }>;
        totalAmount: number;
    }>;
    createPhase(id: string, createPhaseDto: CreatePhaseDto, req: RequestWithUser): Promise<Phase>;
    getBoqDraftPhases(id: string, req: RequestWithUser): Promise<any[]>;
    activateBoqPhases(id: string, body: {
        phaseIds: string[];
        linkedContractorPhaseId?: string;
    }, req: RequestWithUser): Promise<{
        activated: number;
        phases: Phase[];
    }>;
    getProjectPhases(id: string, page: number, limit: number, req: RequestWithUser): Promise<{
        items: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getContractorPhasesForLinking(id: string, req: RequestWithUser): Promise<any[]>;
    updatePhase(projectId: string, phaseId: string, updatePhaseDto: UpdatePhaseDto, req: RequestWithUser): Promise<Phase>;
    deletePhase(projectId: string, phaseId: string, req: RequestWithUser): Promise<{
        message: string;
    }>;
    joinProject(id: string, req: any): Promise<import("../entities/project.entity").Project>;
    createJoinRequest(projectId: string, req: any): Promise<import("../entities/project-access-request.entity").ProjectAccessRequest>;
    listJoinRequestsForProject(projectId: string, req: any): Promise<import("../entities/project-access-request.entity").ProjectAccessRequest[]>;
    approveJoinRequest(projectId: string, requestId: string, req: any): Promise<import("../entities/project-access-request.entity").ProjectAccessRequest>;
    denyJoinRequest(projectId: string, requestId: string, req: any): Promise<import("../entities/project-access-request.entity").ProjectAccessRequest>;
    listMyJoinRequests(req: any): Promise<import("../entities/project-access-request.entity").ProjectAccessRequest[]>;
    listJoinRequestsForOwner(req: any): Promise<import("../entities/project-access-request.entity").ProjectAccessRequest[]>;
    getAvailablePhaseTasks(id: string, req: RequestWithUser): Promise<any[]>;
    getProjectComplaints(id: string): Promise<any[]>;
    getProjectPenalties(id: string): Promise<any[]>;
    getPhaseEvidence(projectId: string, phaseId: string, subPhaseId?: string): Promise<import("../entities/phase-evidence.entity").PhaseEvidence[]>;
    uploadEvidence(projectId: string, phaseId: string, file: Express.Multer.File | undefined, body: {
        subPhaseId?: string;
        type: string;
        notes?: string;
    }, req: RequestWithUser): Promise<import("../entities/phase-evidence.entity").PhaseEvidence>;
    getProjectInventory(id: string, req: RequestWithUser, page?: number, limit?: number, category?: string, search?: string): Promise<{
        items: import("../entities/inventory.entity").Inventory[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    addProjectInventoryItem(id: string, createInventoryDto: any, pictureFile: Express.Multer.File, req: RequestWithUser): Promise<import("../entities/inventory.entity").Inventory>;
    updateProjectInventoryItem(id: string, inventoryId: string, updateData: any, req: RequestWithUser): Promise<import("../entities/inventory.entity").Inventory>;
    deleteProjectInventoryItem(id: string, inventoryId: string, req: RequestWithUser): Promise<{
        message: string;
    }>;
    recordInventoryUsage(id: string, inventoryId: string, body: {
        quantity: number;
        phase_id?: string;
        notes?: string;
    }, req: RequestWithUser): Promise<import("../entities/inventory-usage.entity").InventoryUsage>;
    getInventoryUsageHistory(id: string, inventoryId: string, page: number, limit: number, req: RequestWithUser): Promise<{
        items: import("../entities/inventory-usage.entity").InventoryUsage[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getProjectInventoryUsage(id: string, page: number, limit: number, req: RequestWithUser): Promise<{
        items: import("../entities/inventory-usage.entity").InventoryUsage[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    linkInventoryToProject(projectId: string, inventoryId: string, req: RequestWithUser): Promise<import("../entities/inventory.entity").Inventory>;
    unlinkInventoryFromProject(projectId: string, inventoryId: string, req: RequestWithUser): Promise<import("../entities/inventory.entity").Inventory>;
}
