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
exports.ProjectsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const project_entity_1 = require("../entities/project.entity");
const task_entity_1 = require("../entities/task.entity");
const XLSX = require("xlsx");
const activities_service_1 = require("../activities/activities.service");
const users_service_1 = require("../users/users.service");
const phase_entity_1 = require("../entities/phase.entity");
const tasks_service_1 = require("../tasks/tasks.service");
const project_access_request_entity_1 = require("../entities/project-access-request.entity");
const activity_entity_1 = require("../entities/activity.entity");
const phase_entity_2 = require("../entities/phase.entity");
const dashboard_service_1 = require("../dashboard/dashboard.service");
const boq_parser_service_1 = require("./boq-parser.service");
const amount_utils_1 = require("../utils/amount.utils");
const inventory_entity_1 = require("../entities/inventory.entity");
const inventory_usage_entity_1 = require("../entities/inventory-usage.entity");
const project_dashboard_service_1 = require("./services/project-dashboard.service");
const project_consultant_service_1 = require("./services/project-consultant.service");
const project_contractor_service_1 = require("./services/project-contractor.service");
function normalizeColumnName(name) {
    return name.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
}
let ProjectsService = class ProjectsService {
    constructor(projectsRepository, tasksRepository, phasesRepository, accessRequestRepository, inventoryRepository, inventoryUsageRepository, usersService, activitiesService, tasksService, dashboardService, boqParserService, projectDashboardService, projectConsultantService, projectContractorService) {
        this.projectsRepository = projectsRepository;
        this.tasksRepository = tasksRepository;
        this.phasesRepository = phasesRepository;
        this.accessRequestRepository = accessRequestRepository;
        this.inventoryRepository = inventoryRepository;
        this.inventoryUsageRepository = inventoryUsageRepository;
        this.usersService = usersService;
        this.activitiesService = activitiesService;
        this.tasksService = tasksService;
        this.dashboardService = dashboardService;
        this.boqParserService = boqParserService;
        this.projectDashboardService = projectDashboardService;
        this.projectConsultantService = projectConsultantService;
        this.projectContractorService = projectContractorService;
        this.parseAmountValue = amount_utils_1.parseAmount;
    }
    async findAll() {
        return this.projectsRepository.find({
            relations: ["owner", "collaborators", "phases"],
        });
    }
    async findAllPaginated({ page = 1, limit = 10, search, status, }) {
        const pageNum = Number(page) || 1;
        const limitNum = Number(limit) || 10;
        const qb = this.projectsRepository
            .createQueryBuilder("project")
            .leftJoinAndSelect("project.owner", "owner")
            .leftJoinAndSelect("project.collaborators", "collaborators")
            .leftJoinAndSelect("project.phases", "phases")
            .leftJoinAndSelect("phases.subPhases", "subPhases");
        if (search) {
            qb.andWhere("(project.title ILIKE :search OR project.description ILIKE :search)", { search: `%${search}%` });
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
    async findUserProjects(userId) {
        return this.projectsRepository.find({
            where: [{ owner_id: userId }, { collaborators: { id: userId } }],
            relations: ["owner", "collaborators", "phases"],
            order: { updated_at: "DESC" },
        });
    }
    async findUserProjectsPaginated(userId, { page = 1, limit = 10, search, status, }) {
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
            qb.andWhere("(project.title ILIKE :search OR project.description ILIKE :search)", { search: `%${search}%` });
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
    async findOne(id, userId) {
        if (!id) {
            throw new common_1.BadRequestException("Project ID is required");
        }
        const project = await this.projectsRepository.findOne({
            where: { id },
            relations: ["owner", "collaborators", "phases", "phases.subPhases"],
        });
        if (!project) {
            throw new common_1.NotFoundException(`Project with ID ${id} not found`);
        }
        if (userId) {
            const user = await this.usersService.findOne(userId);
            const isContractor = user?.role === "contractor";
            const isSubContractor = user?.role === "sub_contractor";
            const isAdmin = user?.role === "consultant";
            const isConsultant = user?.role === "consultant";
            if (!isContractor &&
                !isSubContractor &&
                !isAdmin &&
                !isConsultant &&
                !this.hasProjectAccess(project, userId)) {
                throw new common_1.ForbiddenException("You don't have access to this project");
            }
        }
        if (project.phases?.length > 0) {
            project.phases.sort((a, b) => a.created_at.getTime() - b.created_at.getTime());
        }
        return project;
    }
    async create(createProjectDto, owner) {
        if (!owner?.id) {
            throw new common_1.BadRequestException("Owner is required");
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
            totalAmount: this.validateAndNormalizeProjectAmount(createProjectDto.totalAmount ?? 0),
            totalBudget: this.validateAndNormalizeProjectAmount(createProjectDto.totalAmount ?? 0),
        });
        if (createProjectDto.collaborator_ids?.length) {
            const collaborators = await this.getValidatedCollaborators(createProjectDto.collaborator_ids);
            project.collaborators = collaborators;
        }
        const savedProject = await this.projectsRepository.save(project);
        try {
            await this.activitiesService.logProjectCreated(owner, savedProject, null);
        }
        catch (error) {
            console.warn("Failed to log project creation activity:", error);
        }
        await this.dashboardService.updateStats();
        return this.findOne(savedProject.id);
    }
    async update(id, updateProjectDto, userId) {
        const project = await this.findOne(id);
        const user = await this.usersService.findOne(userId);
        const isAdmin = user?.role === "admin";
        const isConsultant = user?.role === "consultant";
        if (project.owner_id !== userId && !isAdmin && !isConsultant) {
            throw new common_1.ForbiddenException("Only the project owner, admin, or consultant can update the project");
        }
        if (updateProjectDto.collaborator_ids) {
            const collaborators = await this.getValidatedCollaborators(updateProjectDto.collaborator_ids);
            project.collaborators = collaborators;
        }
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
    async remove(id, userId) {
        const project = await this.findOne(id);
        const user = await this.usersService.findOne(userId);
        const isAdmin = user?.role === "admin";
        const isConsultant = user?.role === "consultant";
        if (project.owner_id !== userId && !isAdmin && !isConsultant) {
            throw new common_1.ForbiddenException("Only the project owner, admin, or consultant can delete the project");
        }
        await this.projectsRepository.remove(project);
        await this.dashboardService.updateStats();
    }
    async addCollaborator(projectId, collaborator, userId) {
        const project = await this.findOne(projectId);
        const user = await this.usersService.findOne(userId);
        const isAdmin = user?.role === "admin";
        const isConsultant = user?.role === "consultant";
        if (project.owner_id !== userId && !isAdmin && !isConsultant) {
            throw new common_1.ForbiddenException("Only the project owner, admin, or consultant can add collaborators");
        }
        if (!project.collaborators) {
            project.collaborators = [];
        }
        if (project.collaborators.some((c) => c.id === collaborator.id)) {
            throw new common_1.BadRequestException("User is already a collaborator");
        }
        if (project.owner_id === collaborator.id) {
            throw new common_1.BadRequestException("Owner cannot be added as collaborator");
        }
        project.collaborators.push(collaborator);
        return this.projectsRepository.save(project);
    }
    async removeCollaborator(projectId, collaboratorId, userId) {
        const project = await this.findOne(projectId);
        const user = await this.usersService.findOne(userId);
        const isAdmin = user?.role === "admin";
        const isConsultant = user?.role === "consultant";
        if (project.owner_id !== userId && !isAdmin && !isConsultant) {
            throw new common_1.ForbiddenException("Only the project owner, admin, or consultant can remove collaborators");
        }
        const initialLength = project.collaborators?.length || 0;
        project.collaborators =
            project.collaborators?.filter((c) => c.id !== collaboratorId) || [];
        if (project.collaborators.length === initialLength) {
            throw new common_1.NotFoundException("Collaborator not found in project");
        }
        return this.projectsRepository.save(project);
    }
    async processBoqFile(projectId, file, userId) {
        console.log("\n=== BOQ File Processing Started ===");
        console.log(`File Name: ${file.originalname}`);
        console.log(`File Size: ${file.size} bytes`);
        console.log(`File Type: ${file.mimetype}`);
        const project = await this.findOne(projectId, userId);
        console.log(`\nProcessing BOQ for Project: ${project.title} (ID: ${project.id})`);
        if (!file?.buffer) {
            throw new common_1.BadRequestException("No file uploaded or file buffer missing");
        }
        try {
            const parseResult = await this.boqParserService.parseBoqFile(file);
            console.log(`[BOQ Processing] Parser results:`, {
                itemsFound: parseResult.items.length,
                totalAmount: parseResult.totalAmount,
                sections: parseResult.sections,
                skipped: parseResult.metadata.skippedRows,
                fileType: parseResult.metadata.fileType,
            });
            return this.processBoqFileFromParsedData(projectId, parseResult.items, parseResult.totalAmount, userId, file.originalname);
        }
        catch (error) {
            console.error("\n=== BOQ Processing Error ===");
            console.error("Error processing BOQ file:", error);
            const existingPhases = await this.phasesRepository.find({
                where: { project_id: projectId },
            });
            if (existingPhases.length > 0) {
                console.warn(`Warning: Error occurred but ${existingPhases.length} phases were already created`);
                return {
                    message: `BOQ file processed with warnings. Created ${existingPhases.length} phases.`,
                    totalAmount: (await this.findOne(projectId, userId)).totalAmount || 0,
                    tasks: [],
                };
            }
            throw new common_1.BadRequestException(`Failed to process BOQ file: ${error.message}`);
        }
    }
    async processBoqFileFromParsedData(projectId, data, totalAmount, userId, fileName) {
        if (!projectId || projectId.trim() === '') {
            console.error('[ERROR] projectId is missing or empty in processBoqFileFromParsedData');
            throw new common_1.BadRequestException('Project ID is required to process BOQ file');
        }
        console.log(`[DEBUG] Processing BOQ - projectId: ${projectId}, userId: ${userId}`);
        const project = await this.findOne(projectId, userId);
        if (!project || !project.id) {
            console.error('[ERROR] Project not found or invalid:', { projectId, project });
            throw new common_1.NotFoundException(`Project with ID ${projectId} not found`);
        }
        console.log(`\nProcessing BOQ for Project: ${project.title} (ID: ${project.id})`);
        try {
            const dataWithUnits = data.filter((row) => {
                const unit = row.unit ||
                    row.Unit ||
                    row._extractedUnit ||
                    (row.rawData && (row.rawData.unit || row.rawData.Unit)) ||
                    '';
                const quantity = row.quantity !== undefined ? row.quantity :
                    row.Quantity !== undefined ? row.Quantity :
                        row._extractedQuantity !== undefined ? row._extractedQuantity :
                            (row.rawData && (row.rawData.quantity || row.rawData.Quantity)) ?
                                (typeof row.rawData.quantity === 'number' ? row.rawData.quantity :
                                    typeof row.rawData.Quantity === 'number' ? row.rawData.Quantity :
                                        parseFloat(String(row.rawData.quantity || row.rawData.Quantity || 0))) :
                                0;
                const unitStr = String(unit || "").trim();
                const hasUnit = unitStr && unitStr !== "" && unitStr !== "No";
                const hasQuantity = quantity && quantity > 0;
                return hasUnit && hasQuantity;
            });
            console.log(`Filtered ${data.length} rows to ${dataWithUnits.length} rows with BOTH Unit and Quantity filled`);
            console.log(`[DEBUG processBoqFileFromParsedData] About to create phases - projectId: ${projectId}, project.id: ${project.id}`);
            if (!projectId || projectId !== project.id) {
                console.error(`[ERROR] projectId mismatch! projectId: ${projectId}, project.id: ${project.id}`);
                throw new common_1.BadRequestException('Project ID mismatch when creating phases');
            }
            const createdPhases = await this.createPhasesFromBoqData(dataWithUnits, projectId, userId);
            console.log(`[DEBUG] Created ${createdPhases.length} phases. Verifying all have project_id...`);
            for (const phase of createdPhases) {
                if (!phase.project_id || phase.project_id !== projectId) {
                    console.error(`[ERROR] Phase ${phase.id} has invalid project_id: ${phase.project_id}, expected: ${projectId}`);
                    throw new Error(`Phase ${phase.id} was created without valid project_id`);
                }
            }
            console.log(`[DEBUG] Reloading project ${project.id} without relations before saving...`);
            const projectToUpdate = await this.projectsRepository.findOne({
                where: { id: project.id },
            });
            if (!projectToUpdate) {
                throw new common_1.NotFoundException(`Project with ID ${project.id} not found`);
            }
            projectToUpdate.totalAmount = totalAmount;
            console.log(`[DEBUG] Saving project ${projectToUpdate.id} with totalAmount: ${totalAmount}`);
            await this.projectsRepository.save(projectToUpdate);
            console.log(`[DEBUG] Project saved successfully`);
            try {
                await this.activitiesService.logBoqUploaded(project.owner, project, fileName || "BOQ File", createdPhases.length, totalAmount);
            }
            catch (error) {
                console.warn("Failed to log BOQ upload activity:", error);
            }
            console.log("\n=== BOQ Processing Complete ===");
            console.log(`BOQ data parsed: ${data.length} rows, Total Amount: ${totalAmount}`);
            console.log(`Created ${createdPhases.length} phases from rows with Unit column filled`);
            return {
                message: `Successfully processed BOQ file and created ${createdPhases.length} phases from rows with Unit column filled.`,
                totalAmount,
                tasks: [],
            };
        }
        catch (error) {
            console.error("\n=== BOQ Processing Error ===");
            console.error("Error processing BOQ data:", error);
            throw new common_1.BadRequestException(`Failed to process BOQ data: ${error.message}`);
        }
    }
    async createPhase(projectId, createPhaseDto, userId) {
        if (!projectId || projectId.trim() === '') {
            console.error('[ERROR] projectId is missing or empty in createPhase');
            throw new common_1.BadRequestException('Project ID is required when creating a phase');
        }
        console.log(`[DEBUG] Creating phase - projectId: ${projectId}, userId: ${userId}`);
        const project = await this.findOne(projectId, userId);
        if (!project || !project.id) {
            console.error('[ERROR] Project not found or invalid:', { projectId, project });
            throw new common_1.NotFoundException(`Project with ID ${projectId} not found`);
        }
        const existingPhase = await this.phasesRepository.findOne({
            where: { project_id: projectId, title: createPhaseDto.title },
        });
        if (existingPhase) {
            throw new common_1.BadRequestException("A phase with this title already exists for this project.");
        }
        let status = createPhaseDto.status;
        if (createPhaseDto.startDate) {
            const startDate = new Date(createPhaseDto.startDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if ((!status || status === phase_entity_2.PhaseStatus.NOT_STARTED) &&
                startDate <= today) {
                status = phase_entity_2.PhaseStatus.IN_PROGRESS;
            }
        }
        if (!projectId || projectId.trim() === '') {
            throw new common_1.BadRequestException('Project ID is required when creating a phase');
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
            project_id: projectId,
            subPhases: createPhaseDto.subPhases ?? [],
        };
        console.log('[DEBUG] Phase data before save:', {
            projectId: phaseData.project_id,
            title: phaseData.title,
            hasProjectId: !!phaseData.project_id,
        });
        const phase = this.phasesRepository.create({
            ...phaseData,
            project: project,
        });
        if (!phase.project_id) {
            console.error('[ERROR] Phase created without project_id:', phase);
            throw new common_1.BadRequestException('Phase must have a valid project_id');
        }
        const savedPhase = await this.phasesRepository.save(phase);
        const user = await this.usersService.findOne(userId);
        await this.activitiesService.createActivity(activity_entity_1.ActivityType.TASK_CREATED, `Phase "${savedPhase.title}" was created`, user, project, savedPhase, { phaseId: savedPhase.id });
        if (createPhaseDto.tasks?.length) {
            for (const taskDto of createPhaseDto.tasks) {
                if (taskDto.id) {
                    await this.tasksRepository.update(taskDto.id, {
                        phase_id: savedPhase.id,
                    });
                }
                else {
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
    async updatePhase(projectId, phaseId, updatePhaseDto, userId) {
        if (!projectId || projectId.trim() === '') {
            console.error('[ERROR] projectId is missing or empty in updatePhase');
            throw new common_1.BadRequestException('Project ID is required when updating a phase');
        }
        console.log(`[DEBUG] Updating phase - projectId: ${projectId}, phaseId: ${phaseId}, userId: ${userId}`);
        const project = await this.projectsRepository.findOne({
            where: { id: projectId },
        });
        if (!project)
            throw new common_1.NotFoundException("Project not found");
        const user = await this.usersService.findOne(userId);
        const isContractor = user?.role === "contractor";
        const isSubContractor = user?.role === "sub_contractor";
        const isAdmin = user?.role === "admin";
        const isConsultant = user?.role === "consultant";
        const isOwner = project.owner_id === userId;
        if (!isOwner && !isContractor && !isSubContractor && !isAdmin && !isConsultant) {
            throw new common_1.ForbiddenException("Only the project owner, contractor, sub_contractor, admin, or consultant can update a phase");
        }
        const phase = await this.phasesRepository.findOne({
            where: { id: phaseId, project_id: projectId },
        });
        if (!phase) {
            throw new common_1.NotFoundException("Phase not found");
        }
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
        if (!phase.project_id) {
            console.error('[ERROR] Phase missing project_id during update:', phase);
            phase.project_id = projectId;
        }
        console.log(`[DEBUG] Updating phase with project_id: ${phase.project_id}`);
        Object.assign(phase, updateData);
        if (!phase.project_id || phase.project_id.trim() === '') {
            throw new common_1.BadRequestException('Phase must have a valid project_id');
        }
        const updatedPhase = await this.phasesRepository.save(phase);
        await this.activitiesService.createActivity(activity_entity_1.ActivityType.TASK_UPDATED, `Phase "${updatedPhase.title}" was updated`, user, project, updatedPhase, { phaseId: updatedPhase.id });
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
            await this.activitiesService.logPhaseCompleted(user, project, updatedPhase, phaseNumber, totalPhases);
            if (updatedPhase.end_date &&
                new Date(updatedPhase.end_date) < new Date()) {
                const delayDays = Math.ceil((new Date().getTime() - new Date(updatedPhase.end_date).getTime()) /
                    (1000 * 60 * 60 * 24));
                await this.activitiesService.logPhaseDelay(user, project, updatedPhase, phaseNumber, totalPhases, delayDays);
            }
        }
        return updatedPhase;
    }
    async deletePhase(projectId, phaseId, userId) {
        const project = await this.projectsRepository.findOne({
            where: { id: projectId },
        });
        if (!project)
            throw new common_1.NotFoundException("Project not found");
        const user = await this.usersService.findOne(userId);
        const isContractor = user?.role === "contractor";
        const isSubContractor = user?.role === "sub_contractor";
        const isAdmin = user?.role === "admin";
        const isConsultant = user?.role === "consultant";
        const isOwner = project.owner_id === userId;
        if (!isOwner && !isContractor && !isSubContractor && !isAdmin && !isConsultant) {
            throw new common_1.ForbiddenException("Only the project owner, contractor, sub_contractor, admin, or consultant can delete a phase");
        }
        const phase = await this.phasesRepository.findOne({
            where: { id: phaseId, project_id: projectId },
        });
        if (!phase) {
            throw new common_1.NotFoundException("Phase not found");
        }
        await this.phasesRepository.remove(phase);
        await this.activitiesService.createActivity(activity_entity_1.ActivityType.TASK_DELETED, `Phase "${phase.title}" was deleted`, user, project, phase, { phaseId: phase.id });
    }
    async getProjectPhases(projectId, userId) {
        return this.projectContractorService.getProjectPhases(projectId, userId);
    }
    async getProjectPhasesPaginated(projectId, userId, { page = 1, limit = 10 }) {
        const user = await this.usersService.findOne(userId);
        const isContractor = user?.role === "contractor";
        const isSubContractor = user?.role === "sub_contractor";
        if (!isContractor && !isSubContractor) {
            await this.findOne(projectId, userId);
        }
        else {
            const project = await this.projectsRepository.findOne({
                where: { id: projectId },
            });
            if (!project) {
                throw new common_1.NotFoundException(`Project with ID ${projectId} not found`);
            }
        }
        const pageNum = Number(page) || 1;
        const limitNum = Number(limit) || 10;
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
    async getAvailableAssignees(projectId) {
        const project = await this.projectsRepository.findOne({
            where: { id: projectId },
            relations: ["owner", "collaborators"],
        });
        if (!project) {
            throw new common_1.NotFoundException("Project not found");
        }
        return [project.owner, ...(project.collaborators || [])];
    }
    async getProjectResponse(project) {
        const calculatePhaseCompletion = (phase) => {
            if (phase.subPhases && phase.subPhases.length > 0) {
                const completed = phase.subPhases.filter((sp) => sp.isCompleted).length;
                return Math.round((completed / phase.subPhases.length) * 100);
            }
            if (phase.progress != null && phase.progress !== undefined) {
                const progress = Number(phase.progress);
                if (!Number.isNaN(progress) && Number.isFinite(progress)) {
                    return Math.max(0, Math.min(100, Math.round(progress)));
                }
            }
            if (phase.status === 'completed') {
                return 100;
            }
            else if (phase.status === 'in_progress') {
                return 50;
            }
            else if (phase.status === 'not_started') {
                return 0;
            }
            return 0;
        };
        const phases = project.phases || [];
        const projectProgress = phases.length > 0
            ? Math.round(phases.reduce((sum, p) => sum + calculatePhaseCompletion(p), 0) /
                phases.length)
            : 0;
        const completedPhases = phases.filter((p) => p.status === "completed").length;
        const totalPhases = phases.length;
        return {
            id: project.id,
            name: project.title,
            description: project.description,
            progress: projectProgress,
            completedPhases,
            totalPhases,
            totalAmount: project.totalAmount ?? project.totalBudget ?? 0,
            startDate: project.start_date,
            estimatedCompletion: project.end_date,
            owner: project.owner?.display_name || project.owner_id,
            collaborators: (project.collaborators || []).map((c) => c.display_name || c.id),
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
    async findAllProjects() {
        return this.projectsRepository.find({
            relations: ["owner", "collaborators", "phases"],
        });
    }
    async joinProject(projectId, user) {
        const project = await this.findOne(projectId);
        if (project.owner_id === user.id) {
            throw new common_1.BadRequestException("Owner cannot join as collaborator");
        }
        if (project.collaborators?.some((c) => c.id === user.id)) {
            throw new common_1.BadRequestException("User is already a collaborator");
        }
        if (!project.collaborators) {
            project.collaborators = [];
        }
        project.collaborators.push(user);
        await this.activitiesService.logCollaboratorAdded(user, project, user);
        return this.projectsRepository.save(project);
    }
    async createJoinRequest(projectId, requesterId) {
        const existing = await this.accessRequestRepository.findOne({
            where: {
                project_id: projectId,
                requester_id: requesterId,
                status: "pending",
            },
        });
        if (existing)
            throw new common_1.BadRequestException("A pending join request already exists.");
        const request = this.accessRequestRepository.create({
            project_id: projectId,
            requester_id: requesterId,
            status: "pending",
        });
        const savedRequest = await this.accessRequestRepository.save(request);
        return savedRequest;
    }
    async listJoinRequestsForProject(projectId, ownerId) {
        const project = await this.projectsRepository.findOne({
            where: { id: projectId },
        });
        if (!project)
            throw new common_1.NotFoundException("Project not found");
        const user = await this.usersService.findOne(ownerId);
        const isAdmin = user?.role === "admin";
        const isConsultant = user?.role === "consultant";
        if (project.owner_id !== ownerId && !isAdmin && !isConsultant)
            throw new common_1.ForbiddenException("Only the owner, admin, or consultant can view join requests");
        return this.accessRequestRepository.find({
            where: { project_id: projectId },
            order: { created_at: "DESC" },
        });
    }
    async approveJoinRequest(projectId, requestId, ownerId) {
        const project = await this.projectsRepository.findOne({
            where: { id: projectId },
            relations: ["collaborators"],
        });
        if (!project)
            throw new common_1.NotFoundException("Project not found");
        const user = await this.usersService.findOne(ownerId);
        const isAdmin = user?.role === "admin";
        const isConsultant = user?.role === "consultant";
        if (project.owner_id !== ownerId && !isAdmin && !isConsultant)
            throw new common_1.ForbiddenException("Only the owner, admin, or consultant can approve join requests");
        const request = await this.accessRequestRepository.findOne({
            where: { id: requestId, project_id: projectId },
        });
        if (!request)
            throw new common_1.NotFoundException("Join request not found");
        if (request.status !== "pending")
            throw new common_1.BadRequestException("Request is not pending");
        const requesterUser = await this.usersService.findOne(request.requester_id);
        if (!project.collaborators.some((c) => c.id === requesterUser.id)) {
            project.collaborators.push(requesterUser);
            await this.projectsRepository.save(project);
        }
        request.status = "approved";
        request.reviewed_at = new Date();
        return this.accessRequestRepository.save(request);
    }
    async denyJoinRequest(projectId, requestId, ownerId) {
        const project = await this.projectsRepository.findOne({
            where: { id: projectId },
        });
        if (!project)
            throw new common_1.NotFoundException("Project not found");
        const user = await this.usersService.findOne(ownerId);
        const isAdmin = user?.role === "admin";
        const isConsultant = user?.role === "consultant";
        if (project.owner_id !== ownerId && !isAdmin && !isConsultant)
            throw new common_1.ForbiddenException("Only the owner, admin, or consultant can deny join requests");
        const request = await this.accessRequestRepository.findOne({
            where: { id: requestId, project_id: projectId },
        });
        if (!request)
            throw new common_1.NotFoundException("Join request not found");
        if (request.status !== "pending")
            throw new common_1.BadRequestException("Request is not pending");
        request.status = "denied";
        request.reviewed_at = new Date();
        return this.accessRequestRepository.save(request);
    }
    async listMyJoinRequests(userId) {
        return this.accessRequestRepository.find({
            where: { requester_id: userId },
            order: { created_at: "DESC" },
        });
    }
    async listJoinRequestsForOwner(ownerId) {
        const projects = await this.projectsRepository.find({
            where: { owner_id: ownerId },
        });
        const projectIds = projects.map((p) => p.id);
        if (projectIds.length === 0)
            return [];
        return this.accessRequestRepository.find({
            where: { project_id: (0, typeorm_2.In)(projectIds) },
            order: { created_at: "DESC" },
        });
    }
    async getAvailablePhaseTasks(projectId, userId) {
        await this.findOne(projectId, userId);
        const allTasks = await this.tasksRepository.find({
            where: { project_id: projectId },
        });
        return allTasks.filter((task) => !task.phase_id);
    }
    async countAll() {
        return this.projectsRepository.count();
    }
    async getTrends(period = "monthly", from, to) {
        let startDate = undefined;
        let endDate = undefined;
        if (from)
            startDate = new Date(from);
        if (to)
            endDate = new Date(to);
        let groupFormat;
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
        if (endDate)
            qb.andWhere("project.created_at <= :endDate", { endDate });
        qb.groupBy("period").orderBy("period", "ASC");
        return qb.getRawMany();
    }
    async adminList({ search = "", status, page = 1, limit = 10 }) {
        const pageNum = Number(page) || 1;
        const limitNum = Number(limit) || 10;
        const qb = this.projectsRepository
            .createQueryBuilder("project")
            .leftJoinAndSelect("project.owner", "owner")
            .leftJoinAndSelect("project.collaborators", "collaborators")
            .leftJoinAndSelect("project.phases", "phases");
        if (search) {
            qb.andWhere("project.title ILIKE :search OR project.description ILIKE :search", { search: `%${search}%` });
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
    async adminGetDetails(id) {
        const project = await this.projectsRepository.findOne({
            where: { id },
            relations: ["owner", "collaborators", "phases", "phases.subPhases"],
        });
        if (!project) {
            throw new common_1.NotFoundException(`Project with ID ${id} not found`);
        }
        return await this.getProjectResponse(project);
    }
    async getTopActiveProjects(limit = 5) {
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
        }));
    }
    async getGroupedByStatus() {
        const results = await this.projectsRepository
            .createQueryBuilder("project")
            .select("project.status", "status")
            .addSelect("COUNT(*)", "count")
            .groupBy("project.status")
            .getRawMany();
        const total = results.reduce((sum, result) => sum + parseInt(result.count), 0);
        return results.map((result) => ({
            status: result.status,
            count: parseInt(result.count),
            percentage: total > 0 ? (parseInt(result.count) / total) * 100 : 0,
        }));
    }
    hasProjectAccess(project, userId) {
        return (project.owner_id === userId ||
            project.collaborators?.some((c) => c.id === userId) ||
            false);
    }
    async getValidatedCollaborators(collaboratorIds) {
        const collaborators = await Promise.all(collaboratorIds.map(async (id) => {
            try {
                return await this.usersService.findOne(id);
            }
            catch (error) {
                throw new common_1.BadRequestException(`Collaborator with ID ${id} not found`);
            }
        }));
        return collaborators;
    }
    validateAndNormalizeProjectAmount(value) {
        return (0, amount_utils_1.validateAndNormalizeAmount)(value, 999999999999999999.99, 2);
    }
    async parseBoqFile(file) {
        console.log("[DEBUG] Reading CSV file buffer...");
        const csvContent = file.buffer.toString("utf-8");
        const allLines = csvContent.split(/\r?\n/);
        if (allLines.length === 0) {
            throw new common_1.BadRequestException("CSV file is empty");
        }
        console.log(`[DEBUG] Total lines in CSV: ${allLines.length}`);
        const lines = allLines.filter((line) => line.trim().length > 0 || line.includes(','));
        console.log(`[DEBUG] Non-empty lines: ${lines.length}`);
        const headerLine = lines[0];
        const rawHeaders = this.parseCsvLine(headerLine).map((h) => h.trim());
        const headers = [];
        const chineseTranslationColumns = {};
        rawHeaders.forEach((header, index) => {
            const hasChinese = /[\u4e00-\u9fff]/.test(header);
            const hasEnglish = /[a-zA-Z]/.test(header);
            if (hasChinese && hasEnglish) {
                const englishPart = header.replace(/[\u4e00-\u9fff]/g, '').trim();
                const chinesePart = header.replace(/[a-zA-Z0-9\s]/g, '').trim();
                if (englishPart) {
                    headers.push(englishPart);
                    if (chinesePart) {
                        chineseTranslationColumns[index] = chinesePart;
                    }
                }
                else {
                    headers.push(header);
                }
            }
            else {
                headers.push(header);
            }
        });
        const rawData = lines.slice(1).map((line, lineIndex) => {
            try {
                const values = this.parseCsvLine(line);
                const row = { _originalLineIndex: lineIndex + 2 };
                headers.forEach((header, index) => {
                    const value = values[index]?.trim() || "";
                    if (chineseTranslationColumns[index]) {
                        row[`${header}_chinese`] = value;
                    }
                    row[header] = value;
                });
                return row;
            }
            catch (error) {
                console.warn(`[DEBUG] Error parsing line ${lineIndex + 2}: ${error.message}`);
                return { _parseError: true, _originalLineIndex: lineIndex + 2 };
            }
        }).filter((row) => !row._parseError);
        console.log(`[DEBUG] Successfully parsed ${rawData.length} rows from ${lines.length - 1} data lines`);
        const columnMappings = this.getColumnMappingsFromHeaders(headers);
        const descriptionCol = columnMappings.descriptionCol;
        const quantityCol = columnMappings.quantityCol;
        const priceCol = columnMappings.priceCol;
        const filteredData = rawData.filter((row, index) => {
            const hasAnyContent = Object.entries(row).some(([key, val]) => {
                if (key.startsWith('_'))
                    return false;
                const str = val?.toString().trim() || "";
                return str.length > 0 && str !== "-" && str !== "—" && str !== "N/A";
            });
            if (!hasAnyContent) {
                console.log(`[DEBUG] Filtered out empty row at line ${row._originalLineIndex}`);
                return false;
            }
            if (descriptionCol && row[descriptionCol]) {
                const desc = (row[descriptionCol] || "").toString().toLowerCase().trim();
                const isClearlyInvalid = (desc === "total" || desc === "sum" || desc === "subtotal" || desc === "grand total") ||
                    (desc.startsWith("note:") || desc.startsWith("注意:")) ||
                    (desc.startsWith("instruction") || desc.startsWith("说明")) ||
                    (desc.includes("合计") && desc.length < 10) ||
                    (desc.includes("总计") && desc.length < 10);
                if (isClearlyInvalid) {
                    console.log(`[DEBUG] Filtered out invalid row: "${desc}" at line ${row._originalLineIndex}`);
                    return false;
                }
            }
            if (!descriptionCol || !row[descriptionCol] || row[descriptionCol].trim() === "") {
                const hasQuantity = quantityCol && row[quantityCol] && row[quantityCol].toString().trim() !== "";
                const hasPrice = priceCol && row[priceCol] && row[priceCol].toString().trim() !== "";
                if (hasQuantity || hasPrice) {
                    console.log(`[DEBUG] Keeping row without description but with quantity/price at line ${row._originalLineIndex}`);
                    return true;
                }
            }
            return true;
        });
        console.log(`[DEBUG] After filtering: ${filteredData.length} rows (from ${rawData.length} parsed rows)`);
        const processedData = this.detectHierarchicalStructure(filteredData, headers);
        const standardizedData = processedData.map((row) => {
            const standardizedRow = { ...row };
            let totalPriceCol;
            for (const col of headers) {
                const normalized = normalizeColumnName(col);
                if (normalized.includes("total") &&
                    (normalized.includes("price") || normalized.includes("amount"))) {
                    totalPriceCol = col;
                    break;
                }
            }
            if (quantityCol && row[quantityCol]) {
                standardizedRow[quantityCol] = this.standardizeNumber(row[quantityCol]);
            }
            if (priceCol && row[priceCol]) {
                standardizedRow[priceCol] = this.standardizeNumber(row[priceCol]);
            }
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
        let totalPriceCol;
        for (const col of headers) {
            if (typeof col === "string") {
                const normalized = normalizeColumnName(col);
                if (normalized.includes("total") &&
                    (normalized.includes("price") || normalized.includes("amount"))) {
                    totalPriceCol = col;
                    break;
                }
            }
        }
        const validData = standardizedData.filter((row) => {
            if (row.isMainSection) {
                console.log(`[DEBUG] Excluding main section from phases: "${row[descriptionCol]}"`);
                return false;
            }
            const desc = row[descriptionCol];
            const hasDescription = desc && typeof desc === "string" && desc.trim() !== "";
            const hasQuantity = quantityCol && row[quantityCol] && this.parseAmountValue(row[quantityCol]) > 0;
            const hasPrice = priceCol && row[priceCol] && this.parseAmountValue(row[priceCol]) > 0;
            if (hasDescription || hasQuantity || hasPrice) {
                return true;
            }
            console.log(`[DEBUG] Excluding row without description or quantity/price at line ${row._originalLineIndex || 'unknown'}`);
            return false;
        });
        console.log(`[DEBUG] Valid data rows for phase creation: ${validData.length} (from ${standardizedData.length} standardized rows)`);
        let totalAmount = 0;
        if (totalPriceCol) {
            totalAmount = validData.reduce((sum, row) => {
                const amount = this.parseAmountValue(row[totalPriceCol]) || 0;
                return sum + amount;
            }, 0);
            console.log(`Calculated total amount from TOTAL PRICE column: ${totalAmount}`);
        }
        else {
            totalAmount = validData.reduce((sum, row) => {
                let amount = 0;
                if (totalPriceCol && row[totalPriceCol]) {
                    amount = this.parseAmountValue(row[totalPriceCol]) || 0;
                }
                else {
                    const qty = this.parseAmountValue(row[quantityCol]) || 0;
                    const price = this.parseAmountValue(row[priceCol]) || 0;
                    amount = qty * price;
                }
                return sum + amount;
            }, 0);
            console.log(`Calculated total amount from individual rows: ${totalAmount}`);
        }
        return { data: validData, totalAmount };
    }
    parseCsvLine(line) {
        const result = [];
        let current = "";
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++;
                }
                else {
                    inQuotes = !inQuotes;
                }
            }
            else if (char === ',' && !inQuotes) {
                result.push(current);
                current = "";
            }
            else {
                current += char;
            }
        }
        result.push(current);
        return result;
    }
    detectHierarchicalStructure(data, headers) {
        const columnMappings = this.getColumnMappingsFromHeaders(headers);
        const descriptionCol = columnMappings.descriptionCol;
        const quantityCol = columnMappings.quantityCol;
        const priceCol = columnMappings.priceCol;
        if (!descriptionCol)
            return data;
        let currentMainSection = null;
        let currentSubSection = null;
        return data.map((row, index) => {
            const description = (row[descriptionCol] || "").toString().trim();
            const hasQuantity = quantityCol && row[quantityCol] && this.parseAmountValue(row[quantityCol]) > 0;
            const hasPrice = priceCol && row[priceCol] && this.parseAmountValue(row[priceCol]) > 0;
            if (hasQuantity || hasPrice) {
                row.isMainSection = false;
                row.mainSection = currentMainSection;
            }
            else {
                const isAllCaps = description === description.toUpperCase() && description.length < 30;
                const startsWithNumber = /^\d+[\.\)]\s*[A-Z]/.test(description);
                const isVeryShort = description.length < 30;
                if ((isAllCaps || startsWithNumber) && isVeryShort && description.length > 0) {
                    currentMainSection = description;
                    currentSubSection = null;
                    row.isMainSection = true;
                    row.mainSection = description;
                    console.log(`[DEBUG] Detected main section: "${description}"`);
                }
                else {
                    row.isMainSection = false;
                    row.mainSection = currentMainSection;
                }
            }
            if (!row.isMainSection) {
                const hasSubNumbering = /^\d+\.\d+/.test(description);
                const startsWithLowercase = /^[a-z]/.test(description.trim());
                const hasNoQuantity = !quantityCol || !row[quantityCol] || row[quantityCol] === "";
                const hasNoPrice = !priceCol || !row[priceCol] || row[priceCol] === "";
                if (currentMainSection && (hasSubNumbering || startsWithLowercase)) {
                    if (hasNoQuantity && hasNoPrice) {
                        currentSubSection = description;
                        row.isSubSection = true;
                        row.subSection = description;
                    }
                    else {
                        row.isSubSection = false;
                        row.subSection = currentSubSection;
                    }
                }
                else {
                    row.isSubSection = false;
                    row.subSection = currentSubSection;
                }
            }
            else {
                row.isSubSection = false;
                row.subSection = null;
            }
            return row;
        });
    }
    standardizeNumber(value) {
        if (value === null || value === undefined || value === "")
            return 0;
        const str = String(value).trim();
        if (str === "" || str === "-" || str === "—" || str === "N/A")
            return 0;
        const cleaned = str
            .replace(/[^\d.-]/g, '')
            .replace(/,/g, '');
        const num = parseFloat(cleaned);
        return isNaN(num) ? 0 : num;
    }
    getColumnMappingsFromHeaders(headers) {
        const normalizedMap = {};
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
        const findColumn = (field) => {
            for (const synonym of columnSynonyms[field]) {
                const norm = normalizeColumnName(synonym);
                if (normalizedMap[norm])
                    return normalizedMap[norm];
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
    getColumnMappings(worksheet) {
        const headerRow = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            range: 0,
            blankrows: false,
        })[0] || [];
        const normalizedMap = {};
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
        const findColumn = (field) => {
            for (const synonym of columnSynonyms[field]) {
                const norm = normalizeColumnName(synonym);
                if (normalizedMap[norm])
                    return normalizedMap[norm];
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
    async createPhasesFromBoqData(data, projectId, userId) {
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
        const project = await this.findOne(projectId, userId);
        if (!project) {
            throw new Error(`Project with ID ${projectId} not found`);
        }
        const projectStartDate = project.start_date ? new Date(project.start_date) : new Date();
        const projectEndDate = project.end_date ? new Date(project.end_date) : new Date();
        const totalDays = Math.max(1, Math.ceil((projectEndDate.getTime() - projectStartDate.getTime()) / (1000 * 60 * 60 * 24)));
        const phases = [];
        const daysPerPhase = totalDays / Math.max(data.length, 1);
        console.log(`[Phase Creation] Creating ${data.length} phases from BOQ items`);
        for (let i = 0; i < data.length; i++) {
            const item = data[i];
            if (!item) {
                console.warn(`[Phase Creation] Skipping item ${i + 1}: item is null or undefined`);
                continue;
            }
            const itemDescription = item.description ||
                item.Description ||
                item._extractedDescription ||
                item.title ||
                item.Title ||
                (item.rawData && (item.rawData.description || item.rawData.Description)) ||
                '';
            if (!itemDescription || itemDescription.trim() === '') {
                console.warn(`[Phase Creation] Skipping item ${i + 1}: no description found. Item data:`, JSON.stringify(item, null, 2));
                continue;
            }
            const phaseStartDate = new Date(projectStartDate);
            phaseStartDate.setDate(phaseStartDate.getDate() + i * daysPerPhase);
            const phaseEndDate = new Date(phaseStartDate);
            phaseEndDate.setDate(phaseEndDate.getDate() + daysPerPhase);
            const itemUnit = item.unit ||
                item.Unit ||
                item._extractedUnit ||
                (item.rawData && (item.rawData.unit || item.rawData.Unit)) ||
                '';
            const itemQuantity = item.quantity !== undefined && item.quantity !== null ?
                (typeof item.quantity === 'number' ? item.quantity : parseFloat(String(item.quantity)) || 0) :
                item.Quantity !== undefined && item.Quantity !== null ?
                    (typeof item.Quantity === 'number' ? item.Quantity : parseFloat(String(item.Quantity)) || 0) :
                    item._extractedQuantity !== undefined && item._extractedQuantity !== null ?
                        (typeof item._extractedQuantity === 'number' ? item._extractedQuantity : parseFloat(String(item._extractedQuantity)) || 0) :
                        (item.rawData && (item.rawData.quantity || item.rawData.Quantity)) ?
                            (typeof item.rawData.quantity === 'number' ? item.rawData.quantity :
                                typeof item.rawData.Quantity === 'number' ? item.rawData.Quantity :
                                    parseFloat(String(item.rawData.quantity || item.rawData.Quantity || 0))) :
                            0;
            const itemRate = item.rate !== undefined && item.rate !== null ?
                (typeof item.rate === 'number' ? item.rate : parseFloat(String(item.rate)) || 0) :
                item.Rate !== undefined && item.Rate !== null ?
                    (typeof item.Rate === 'number' ? item.Rate : parseFloat(String(item.Rate)) || 0) :
                    (item.rawData && (item.rawData.rate || item.rawData['Rate ($)'] || item.rawData.Rate)) ?
                        (typeof item.rawData.rate === 'number' ? item.rawData.rate :
                            typeof item.rawData['Rate ($)'] === 'number' ? item.rawData['Rate ($)'] :
                                typeof item.rawData.Rate === 'number' ? item.rawData.Rate :
                                    parseFloat(String(item.rawData.rate || item.rawData['Rate ($)'] || item.rawData.Rate || 0))) :
                        0;
            const itemAmount = item.amount !== undefined && item.amount !== null ?
                (typeof item.amount === 'number' ? item.amount : parseFloat(String(item.amount)) || 0) :
                item.Amount !== undefined && item.Amount !== null ?
                    (typeof item.Amount === 'number' ? item.Amount : parseFloat(String(item.Amount)) || 0) :
                    (item.rawData && (item.rawData.amount || item.rawData['Amount ($)'] || item.rawData.Amount)) ?
                        (typeof item.rawData.amount === 'number' ? item.rawData.amount :
                            typeof item.rawData['Amount ($)'] === 'number' ? item.rawData['Amount ($)'] :
                                typeof item.rawData.Amount === 'number' ? item.rawData.Amount :
                                    parseFloat(String(item.rawData.amount || item.rawData['Amount ($)'] || item.rawData.Amount || 0))) :
                        0;
            const itemSection = item.section || item.Section || '';
            const phaseDescription = [
                itemSection ? `Section: ${itemSection}` : null,
                itemUnit ? `Unit: ${itemUnit}` : null,
                itemQuantity ? `Quantity: ${itemQuantity}` : null,
                itemRate > 0 ? `Rate: ${itemRate}` : null,
            ].filter(Boolean).join(' | ');
            const phaseData = {
                title: itemDescription.trim(),
                description: phaseDescription,
                budget: itemAmount || 0,
                start_date: phaseStartDate,
                end_date: phaseEndDate,
                due_date: phaseEndDate,
                progress: 0,
                status: phase_entity_2.PhaseStatus.NOT_STARTED,
                project_id: projectId,
                is_active: false,
                from_boq: true,
            };
            if (!phaseData.project_id || phaseData.project_id.trim() === '') {
                const error = `❌ CRITICAL: Phase "${itemDescription}" has no projectId`;
                console.error(`[Phase Creation] ${error}`);
                throw new Error(error);
            }
            console.log(`[Phase Creation] Creating phase ${i + 1}/${data.length}: "${itemDescription.substring(0, 50)}..."`);
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
                    throw new Error(`Failed to create phase: ${itemDescription}`);
                }
                const savedPhase = await this.phasesRepository.findOne({
                    where: { id: result[0].id },
                    relations: ['project'],
                });
                if (!savedPhase) {
                    throw new Error(`Failed to retrieve created phase: ${itemDescription}`);
                }
                if (savedPhase.project_id !== projectId) {
                    const error = `❌ CRITICAL: Phase "${savedPhase.title}" has incorrect project_id: ${savedPhase.project_id}, expected: ${projectId}`;
                    console.error(`[Phase Creation] ${error}`);
                    throw new Error(error);
                }
                phases.push(savedPhase);
                console.log(`[Phase Creation] ✅ Created phase ${i + 1}: "${itemDescription.substring(0, 40)}" | Budget: ${itemAmount} | Qty: ${itemQuantity} ${itemUnit}`);
            }
            catch (error) {
                console.error(`[Phase Creation] ❌ Failed to create phase "${itemDescription}":`, error);
                throw error;
            }
        }
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
    async createPhasesFromBoqData_OLD(data, projectId, userId) {
        const rowKeys = data.length > 0 ? Object.keys(data[0]) : [];
        const columnMappings = this.getColumnMappingsFromHeaders(rowKeys);
        let { descriptionCol, unitCol, quantityCol, priceCol } = columnMappings;
        console.log(`[DEBUG createPhasesFromBoqData] Column mappings:`, {
            descriptionCol,
            unitCol,
            quantityCol,
            priceCol,
            availableKeys: rowKeys,
            sampleRow: data.length > 0 ? Object.keys(data[0]).reduce((acc, key) => {
                acc[key] = String(data[0][key]).substring(0, 50);
                return acc;
            }, {}) : null
        });
        if (!descriptionCol) {
            throw new common_1.BadRequestException('Could not find DESCRIPTION column in the file. ' +
                'Please ensure your file has a "Description", "Desc", "Item Description", or "Work Description" column. ' +
                `Available columns: ${rowKeys.join(', ')}`);
        }
        if (!quantityCol) {
            throw new common_1.BadRequestException('Could not find QUANTITY column in the file. ' +
                'Please ensure your file has a "Quantity", "Qty", or "Qty." column. ' +
                `Available columns: ${rowKeys.join(', ')}`);
        }
        if (!unitCol) {
            throw new common_1.BadRequestException('Could not find UNIT column in the file. ' +
                'Please ensure your file has a "Unit", "Units", or "UOM" column. ' +
                `Available columns: ${rowKeys.join(', ')}`);
        }
        let totalPriceCol;
        if (data.length > 0) {
            totalPriceCol = rowKeys.find((key) => {
                const normalized = normalizeColumnName(key);
                return (normalized.includes("total") &&
                    (normalized.includes("price") || normalized.includes("amount")));
            });
        }
        const phases = [];
        console.log(`Creating phases from ${data.length} BOQ data rows`);
        const project = await this.findOne(projectId, userId);
        if (!projectId) {
            throw new Error("Project ID is required to create phases");
        }
        const projectStartDate = project.start_date
            ? new Date(project.start_date)
            : new Date();
        const projectEndDate = project.end_date
            ? new Date(project.end_date)
            : new Date();
        const totalDays = Math.max(1, Math.ceil((projectEndDate.getTime() - projectStartDate.getTime()) /
            (1000 * 60 * 60 * 24)));
        const groupedRows = [];
        let currentGroup = [];
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const description = (row[descriptionCol] || "").toString().trim();
            const unit = unitCol ? (row[unitCol] || "").toString().trim() : "";
            const quantity = this.parseAmountValue(quantityCol ? row[quantityCol] : undefined) || 0;
            const price = this.parseAmountValue(priceCol ? row[priceCol] : undefined) || 0;
            const totalPrice = totalPriceCol ? this.parseAmountValue(row[totalPriceCol]) || 0 : 0;
            if (!unit || unit.trim() === "") {
                if (currentGroup.length > 0) {
                    groupedRows.push([...currentGroup]);
                    currentGroup = [];
                }
                continue;
            }
            const hasQuantityAndUnit = quantity > 0 && unit && unit.trim() !== "";
            const hasUnitOnly = !hasQuantityAndUnit && unit && unit.trim() !== "" && description && description.trim() !== "";
            const isSectionHeader = !hasQuantityAndUnit && !hasUnitOnly && !price && !totalPrice && description && description.trim() !== "";
            if (isSectionHeader) {
                if (currentGroup.length > 0) {
                    groupedRows.push([...currentGroup]);
                    currentGroup = [];
                }
                continue;
            }
            if (hasQuantityAndUnit || hasUnitOnly) {
                if (currentGroup.length > 0) {
                    const lastRow = currentGroup[currentGroup.length - 1];
                    const lastUnit = unitCol ? (lastRow[unitCol] || "").toString().trim() : "";
                    const lastHasQuantity = this.parseAmountValue(quantityCol ? lastRow[quantityCol] : undefined) || 0;
                    if ((lastUnit && unit && lastUnit !== unit) ||
                        (lastHasQuantity > 0 && quantity === 0 && unit)) {
                        groupedRows.push([...currentGroup]);
                        currentGroup = [row];
                    }
                    else {
                        currentGroup.push(row);
                    }
                }
                else {
                    currentGroup.push(row);
                }
            }
            else {
                if (currentGroup.length > 0) {
                    groupedRows.push([...currentGroup]);
                    currentGroup = [];
                }
            }
        }
        if (currentGroup.length > 0) {
            groupedRows.push(currentGroup);
        }
        console.log(`Grouped ${data.length} rows into ${groupedRows.length} phases`);
        console.log(`Column mappings: descriptionCol=${descriptionCol}, unitCol=${unitCol}, quantityCol=${quantityCol}, priceCol=${priceCol}`);
        if (groupedRows.length > 0) {
            console.log(`Sample first group (${groupedRows[0].length} rows):`, groupedRows[0].map((r, idx) => ({
                idx,
                desc: r[descriptionCol] || 'NO DESC',
                unit: r[unitCol] || 'NO UNIT',
                qty: r[quantityCol] || 'NO QTY'
            })));
        }
        const daysPerPhase = totalDays / Math.max(groupedRows.length, 1);
        for (let groupIndex = 0; groupIndex < groupedRows.length; groupIndex++) {
            const group = groupedRows[groupIndex];
            let combinedDescription = "";
            let combinedUnit = "";
            let totalQuantity = 0;
            let totalAmount = 0;
            const descriptions = [];
            const units = new Set();
            for (const row of group) {
                let description = "";
                if (row._extractedDescription && row._extractedDescription.trim() !== "") {
                    description = row._extractedDescription.toString().trim();
                    console.log(`[DEBUG] Using extracted description: "${description.substring(0, 50)}"`);
                }
                else if (descriptionCol && row[descriptionCol]) {
                    description = (row[descriptionCol] || "").toString().trim();
                    if (description) {
                        console.log(`[DEBUG] Using mapped description column "${descriptionCol}": "${description.substring(0, 50)}"`);
                    }
                }
                if (!description || description === "") {
                    console.warn(`[WARN] Skipping row in group ${groupIndex + 1}: No description found in mapped column "${descriptionCol}". Available keys:`, Object.keys(row));
                    continue;
                }
                const unit = row._extractedUnit || (unitCol ? (row[unitCol] || "").toString().trim() : "") || "";
                const quantity = row._extractedQuantity !== undefined
                    ? row._extractedQuantity
                    : (this.parseAmountValue(quantityCol ? row[quantityCol] : undefined) || 0);
                const price = this.parseAmountValue(priceCol ? row[priceCol] : undefined) || 0;
                let rowTotalPrice = 0;
                if (totalPriceCol && row[totalPriceCol]) {
                    rowTotalPrice = this.parseAmountValue(row[totalPriceCol]) || 0;
                }
                if (!rowTotalPrice && quantity > 0 && price > 0) {
                    rowTotalPrice = quantity * price;
                }
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
            if (descriptions.length > 0) {
                if (descriptions.length === 1) {
                    combinedDescription = descriptions[0];
                }
                else {
                    combinedDescription = descriptions[0];
                }
            }
            if (units.size > 0) {
                combinedUnit = Array.from(units)[0];
            }
            if (!combinedDescription && totalQuantity === 0 && totalAmount === 0 && group.length === 0) {
                continue;
            }
            let phaseTitle = "";
            if (combinedDescription && combinedDescription.trim() !== "") {
                phaseTitle = combinedDescription.trim();
                console.log(`[DEBUG] Phase ${groupIndex + 1} title from combinedDescription: "${phaseTitle.substring(0, 50)}"`);
            }
            else if (group.length > 0) {
                const firstRow = group[0];
                let firstDesc = "";
                if (firstRow._extractedDescription && firstRow._extractedDescription.trim() !== "") {
                    firstDesc = firstRow._extractedDescription.toString().trim();
                    console.log(`[DEBUG] Phase ${groupIndex + 1} using _extractedDescription: "${firstDesc.substring(0, 50)}"`);
                }
                else if (descriptionCol && firstRow[descriptionCol]) {
                    firstDesc = (firstRow[descriptionCol] || "").toString().trim();
                    if (firstDesc) {
                        console.log(`[DEBUG] Phase ${groupIndex + 1} using mapped column "${descriptionCol}": "${firstDesc.substring(0, 50)}"`);
                    }
                }
                if (!firstDesc || firstDesc === "") {
                    const rowKeys = Object.keys(firstRow).filter(key => !key.startsWith('_'));
                    const descKey = rowKeys.find(key => {
                        const keyLower = key.toLowerCase();
                        const value = String(firstRow[key] || "").trim();
                        return (keyLower.includes('desc') ||
                            keyLower.includes('description') ||
                            keyLower.includes('item') ||
                            keyLower.includes('work')) &&
                            value.length > 5 &&
                            !value.match(/^(No|EA|Rolls|Sets|LM)\s*\d+$/i);
                    });
                    if (descKey) {
                        firstDesc = firstRow[descKey].toString().trim();
                        console.log(`[DEBUG] Phase ${groupIndex + 1} using found column "${descKey}": "${firstDesc.substring(0, 50)}"`);
                    }
                }
                if (!firstDesc || firstDesc.trim() === "") {
                    console.error(`[ERROR] Phase ${groupIndex + 1} has no description in mapped column "${descriptionCol}". Row keys:`, Object.keys(firstRow));
                    console.error(`[ERROR] Row values:`, Object.entries(firstRow).map(([k, v]) => `${k}: ${String(v).substring(0, 50)}`));
                    throw new common_1.BadRequestException(`Phase ${groupIndex + 1} has no description. ` +
                        `Expected description in column "${descriptionCol}" but found empty value. ` +
                        `Please ensure your BOQ file has valid descriptions in the description column.`);
                }
                phaseTitle = firstDesc.trim();
            }
            else {
                throw new common_1.BadRequestException(`Phase ${groupIndex + 1} has no description. ` +
                    `Please ensure your BOQ file has a valid description column with data.`);
            }
            if (phaseTitle === `${combinedUnit} ${totalQuantity}`.trim() ||
                phaseTitle.match(/^(No|EA|Rolls|Sets|LM)\s*\d+$/i)) {
                console.error(`[ERROR] Phase title is unit/qty only: "${phaseTitle}". This indicates the description column was not properly mapped.`);
                console.error(`[ERROR] Expected description column: "${descriptionCol}"`);
                console.error(`[ERROR] Row data sample:`, group[0]);
                console.error(`[ERROR] Available columns:`, Object.keys(group[0]));
                throw new common_1.BadRequestException(`Phase ${groupIndex + 1} has invalid description. ` +
                    `The description column "${descriptionCol}" appears to contain unit/quantity data instead of descriptions. ` +
                    `Please verify your BOQ file has the correct column headers.`);
            }
            const phaseStartDate = new Date(projectStartDate);
            phaseStartDate.setDate(phaseStartDate.getDate() + groupIndex * daysPerPhase);
            const phaseEndDate = new Date(phaseStartDate);
            phaseEndDate.setDate(phaseEndDate.getDate() + daysPerPhase);
            const descParts = [];
            if (combinedUnit)
                descParts.push(`Unit: ${combinedUnit}`);
            if (totalQuantity > 0)
                descParts.push(`Quantity: ${totalQuantity}`);
            if (group.length > 1)
                descParts.push(`Grouped Items: ${group.length}`);
            const phaseDescription = descriptions.length > 1
                ? descriptions.join("; ") + (descParts.length > 0 ? ` | ${descParts.join(" | ")}` : "")
                : (descParts.length > 0 ? descParts.join(" | ") : "");
            console.log(`[DEBUG] Creating phase ${groupIndex + 1} - projectId: ${projectId}, phaseTitle: "${phaseTitle.substring(0, 50)}"`);
            if (!projectId || projectId.trim() === '') {
                console.error(`[ERROR] projectId is undefined when creating phase "${phaseTitle}"`);
                throw new Error('Project ID is required when creating phases from BOQ data');
            }
            const phaseData = {
                title: phaseTitle,
                description: phaseDescription,
                budget: totalAmount || 0,
                start_date: phaseStartDate,
                end_date: phaseEndDate,
                due_date: phaseEndDate,
                progress: 0,
                status: phase_entity_2.PhaseStatus.NOT_STARTED,
                project_id: projectId,
            };
            if (!phaseData.project_id || phaseData.project_id.trim() === '') {
                console.error('[ERROR] Phase data missing project_id:', phaseData);
                throw new Error('Cannot create phase without project_id');
            }
            const insertQuery = `
        INSERT INTO phase (
          title, description, budget, start_date, end_date, due_date, 
          progress, status, project_id, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        ) RETURNING *
      `;
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
                phaseData.project_id,
            ]);
            if (!result || result.length === 0 || !result[0]) {
                console.error(`Failed to create phase: ${phaseTitle} - No result from insert`);
                throw new Error(`Failed to create phase: ${phaseTitle}`);
            }
            if (!result[0].project_id) {
                if (!projectId || projectId.trim() === '') {
                    console.error(`[ERROR] projectId is undefined when trying to fix phase project_id! Phase ID: ${result[0].id}`);
                    await this.phasesRepository.query(`DELETE FROM phase WHERE id = $1`, [result[0].id]);
                    throw new Error(`Cannot create phase without project_id. Phase ${result[0].id} was deleted.`);
                }
                console.error(`Error: Phase created without project_id. Phase ID: ${result[0].id}, Project ID: ${projectId}`);
                await this.phasesRepository.query(`UPDATE phase SET project_id = $1 WHERE id = $2`, [projectId, result[0].id]);
                result[0].project_id = projectId;
            }
            const savedPhase = await this.phasesRepository.findOne({
                where: { id: result[0].id },
                relations: ['project'],
            });
            if (!savedPhase) {
                console.error(`Failed to retrieve created phase: ${result[0].id}`);
                throw new Error(`Failed to retrieve created phase: ${phaseTitle}`);
            }
            if (!savedPhase.project || savedPhase.project.id !== projectId) {
                console.log(`[DEBUG] Setting project relation for phase ${savedPhase.id}`);
                savedPhase.project = project;
                savedPhase.project_id = projectId;
                await this.phasesRepository.save(savedPhase);
                console.log(`[DEBUG] Project relation set for phase ${savedPhase.id} - project.id: ${project.id}`);
            }
            else {
                console.log(`[DEBUG] Phase ${savedPhase.id} already has correct project relation - project.id: ${savedPhase.project.id}`);
            }
            if (savedPhase.project_id !== projectId) {
                console.error(`[ERROR] Phase ${savedPhase.id} has incorrect project_id: ${savedPhase.project_id}, expected: ${projectId}`);
                throw new Error(`Phase ${savedPhase.id} has incorrect project_id`);
            }
            phases.push(savedPhase);
            console.log(`Created phase: "${phaseTitle}" (Budget: ${totalAmount}, Items: ${group.length}, Description: "${combinedDescription || 'N/A'}", Unit: ${combinedUnit || 'N/A'}, Qty: ${totalQuantity}, Project ID: ${projectId})`);
        }
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
    async createTasksFromBoqData(data, projectId) {
        const rowKeys = data.length > 0 ? Object.keys(data[0]) : [];
        const columnMappings = this.getColumnMappingsFromHeaders(rowKeys);
        const { descriptionCol, unitCol, quantityCol, priceCol } = columnMappings;
        const tasks = [];
        console.log(`Creating ${data.length} tasks from BOQ data`);
        for (const row of data) {
            const description = row[descriptionCol] || "";
            const unit = unitCol ? row[unitCol] || "" : "";
            const quantity = this.parseAmountValue(quantityCol ? row[quantityCol] : undefined);
            const price = this.parseAmountValue(priceCol ? row[priceCol] : undefined);
            if (description.trim()) {
                const task = this.tasksRepository.create({
                    description: description.trim(),
                    unit: unit.trim(),
                    quantity,
                    price,
                    project: { id: projectId },
                });
                const savedTask = await this.tasksRepository.save(task);
                tasks.push(savedTask);
                console.log(`Created task: ${description} (${quantity} ${unit} @ ${price})`);
            }
        }
        return tasks;
    }
    async previewBoqFile(file) {
        if (!file?.buffer) {
            throw new common_1.BadRequestException("No file uploaded or file buffer missing");
        }
        console.log(`[BOQ Preview] Parsing file: ${file.originalname}`);
        const parseResult = await this.boqParserService.parseBoqFile(file);
        console.log(`[BOQ Preview] Parser results:`, {
            itemsFound: parseResult.items.length,
            totalAmount: parseResult.totalAmount,
            sections: parseResult.sections,
            skipped: parseResult.metadata.skippedRows,
        });
        const phases = parseResult.items.map((item) => {
            const descParts = [];
            if (item.section)
                descParts.push(`Section: ${item.section}`);
            descParts.push(`Unit: ${item.unit}`);
            descParts.push(`Quantity: ${item.quantity}`);
            if (item.rate > 0)
                descParts.push(`Rate: ${item.rate}`);
            return {
                title: item.description,
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
    async createTasksRecursive(tasks, projectId, phaseId, parentTaskId = null) {
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
                await this.createTasksRecursive(subTasks, projectId, phaseId, savedTask.id);
            }
        }
    }
    getConsultantProjectSummary(project) {
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
        };
    }
    async getAllConsultantProjects() {
        return this.projectConsultantService.getAllConsultantProjects();
    }
    async getAllConsultantProjectsPaginated(page = 1, limit = 10, search, status) {
        return this.projectConsultantService.getAllConsultantProjectsPaginated(page, limit, search, status);
    }
    async getConsultantProjectDetails(id) {
        return this.projectConsultantService.getConsultantProjectDetails(id);
    }
    async getConsultantProjectPhases(projectId) {
        return this.projectConsultantService.getConsultantProjectPhases(projectId);
    }
    async getConsultantProjectPhasesPaginated(projectId, { page = 1, limit = 10 }) {
        return this.projectConsultantService.getConsultantProjectPhasesPaginated(projectId, page, limit);
    }
    async getBoqDraftPhases(projectId, userId) {
        return this.projectConsultantService.getBoqDraftPhases(projectId, userId);
    }
    async activateBoqPhases(projectId, phaseIds, userId) {
        const project = await this.findOne(projectId, userId);
        if (!phaseIds || phaseIds.length === 0) {
            throw new common_1.BadRequestException('No phase IDs provided');
        }
        console.log(`[Activate BOQ Phases] Activating ${phaseIds.length} phases for project ${projectId}`);
        const activatedPhases = [];
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
            phase.is_active = true;
            await this.phasesRepository.save(phase);
            activatedPhases.push(phase);
            console.log(`[Activate BOQ Phases] ✅ Activated phase: "${phase.title}"`);
        }
        try {
            const user = await this.usersService.findOne(userId);
            const totalPhases = await this.phasesRepository.count({
                where: { project_id: projectId, is_active: true },
            });
            for (let i = 0; i < activatedPhases.length; i++) {
                const phase = activatedPhases[i];
                try {
                    await this.activitiesService.logPhaseCreated(user, project, phase, totalPhases - activatedPhases.length + i + 1, totalPhases);
                }
                catch (err) {
                    console.warn(`Failed to log activity for phase ${phase.id}:`, err);
                }
            }
        }
        catch (error) {
            console.warn('Failed to log phase activation activities:', error);
        }
        return {
            activated: activatedPhases.length,
            phases: activatedPhases,
        };
    }
    async getConsultantProjectTasks(projectId) {
        return this.projectConsultantService.getConsultantProjectTasks(projectId);
    }
    async getProjectCompletionTrends(period = "daily", from, to) {
        let startDate = undefined;
        let endDate = undefined;
        if (from)
            startDate = new Date(from);
        if (to)
            endDate = new Date(to);
        let groupFormat;
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
            .addSelect("COUNT(CASE WHEN project.status = 'completed' THEN 1 END)", "completed")
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
            completionRate: result.total > 0
                ? (parseInt(result.completed || "0") / parseInt(result.total)) * 100
                : 0,
        }));
    }
    async getProjectInventory(projectId, userId, options) {
        return this.projectContractorService.getProjectInventory(projectId, userId, options);
    }
    async addProjectInventoryItem(projectId, createInventoryDto, userId, pictureFile) {
        return this.projectContractorService.addProjectInventoryItem(projectId, createInventoryDto, userId, pictureFile);
    }
    async updateProjectInventoryItem(projectId, inventoryId, updateData, userId) {
        return this.projectContractorService.updateProjectInventoryItem(projectId, inventoryId, updateData, userId);
    }
    async deleteProjectInventoryItem(projectId, inventoryId, userId) {
        return this.projectContractorService.deleteProjectInventoryItem(projectId, inventoryId, userId);
    }
    async recordInventoryUsage(projectId, inventoryId, quantity, userId, phaseId, notes) {
        return this.projectContractorService.recordInventoryUsage(projectId, inventoryId, quantity, userId, phaseId, notes);
    }
    async getInventoryUsageHistory(projectId, inventoryId, userId, options) {
        return this.projectContractorService.getInventoryUsageHistory(projectId, inventoryId, userId, options);
    }
    async getProjectInventoryUsage(projectId, userId, options) {
        return this.projectContractorService.getProjectInventoryUsage(projectId, userId, options);
    }
    async linkInventoryToProject(inventoryId, projectId, userId) {
        return this.projectContractorService.linkInventoryToProject(inventoryId, projectId, userId);
    }
    async unlinkInventoryFromProject(inventoryId, projectId, userId) {
        return this.projectContractorService.unlinkInventoryFromProject(inventoryId, projectId, userId);
    }
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
};
exports.ProjectsService = ProjectsService;
exports.ProjectsService = ProjectsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __param(1, (0, typeorm_1.InjectRepository)(task_entity_1.Task)),
    __param(2, (0, typeorm_1.InjectRepository)(phase_entity_1.Phase)),
    __param(3, (0, typeorm_1.InjectRepository)(project_access_request_entity_1.ProjectAccessRequest)),
    __param(4, (0, typeorm_1.InjectRepository)(inventory_entity_1.Inventory)),
    __param(5, (0, typeorm_1.InjectRepository)(inventory_usage_entity_1.InventoryUsage)),
    __param(7, (0, common_1.Inject)((0, common_1.forwardRef)(() => activities_service_1.ActivitiesService))),
    __param(9, (0, common_1.Inject)((0, common_1.forwardRef)(() => dashboard_service_1.DashboardService))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        users_service_1.UsersService,
        activities_service_1.ActivitiesService,
        tasks_service_1.TasksService,
        dashboard_service_1.DashboardService,
        boq_parser_service_1.BoqParserService,
        project_dashboard_service_1.ProjectDashboardService,
        project_consultant_service_1.ProjectConsultantService,
        project_contractor_service_1.ProjectContractorService])
], ProjectsService);
//# sourceMappingURL=projects.service.js.map