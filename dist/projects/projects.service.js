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
const phase_entity_2 = require("../entities/phase.entity");
const dashboard_service_1 = require("../dashboard/dashboard.service");
const boq_parser_service_1 = require("./boq-parser.service");
const amount_utils_1 = require("../utils/amount.utils");
const inventory_entity_1 = require("../entities/inventory.entity");
const inventory_usage_entity_1 = require("../entities/inventory-usage.entity");
const project_dashboard_service_1 = require("./services/project-dashboard.service");
const project_consultant_service_1 = require("./services/project-consultant.service");
const project_contractor_service_1 = require("./services/project-contractor.service");
const project_phase_service_1 = require("./services/project-phase.service");
const project_boq_service_1 = require("./services/project-boq.service");
const project_collaboration_service_1 = require("./services/project-collaboration.service");
const project_boq_entity_1 = require("../entities/project-boq.entity");
const project_financial_summary_entity_1 = require("../entities/project-financial-summary.entity");
const project_metadata_entity_1 = require("../entities/project-metadata.entity");
const project_settings_entity_1 = require("../entities/project-settings.entity");
function normalizeColumnName(name) {
    return name.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
}
let ProjectsService = class ProjectsService {
    constructor(projectsRepository, tasksRepository, phasesRepository, accessRequestRepository, inventoryRepository, inventoryUsageRepository, projectBoqRepository, financialSummaryRepository, metadataRepository, settingsRepository, usersService, activitiesService, tasksService, dashboardService, boqParserService, projectDashboardService, projectConsultantService, projectContractorService, projectPhaseService, projectBoqService, projectCollaborationService, dataSource) {
        this.projectsRepository = projectsRepository;
        this.tasksRepository = tasksRepository;
        this.phasesRepository = phasesRepository;
        this.accessRequestRepository = accessRequestRepository;
        this.inventoryRepository = inventoryRepository;
        this.inventoryUsageRepository = inventoryUsageRepository;
        this.projectBoqRepository = projectBoqRepository;
        this.financialSummaryRepository = financialSummaryRepository;
        this.metadataRepository = metadataRepository;
        this.settingsRepository = settingsRepository;
        this.usersService = usersService;
        this.activitiesService = activitiesService;
        this.tasksService = tasksService;
        this.dashboardService = dashboardService;
        this.boqParserService = boqParserService;
        this.projectDashboardService = projectDashboardService;
        this.projectConsultantService = projectConsultantService;
        this.projectContractorService = projectContractorService;
        this.projectPhaseService = projectPhaseService;
        this.projectBoqService = projectBoqService;
        this.projectCollaborationService = projectCollaborationService;
        this.dataSource = dataSource;
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
            .leftJoinAndSelect("project.collaborators", "collaborators");
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
            const isConsultant = user?.role === "consultant";
            if (isConsultant) {
            }
            else if (isContractor || isSubContractor) {
                if (!this.hasProjectAccess(project, userId)) {
                    throw new common_1.ForbiddenException("You don't have access to this project. You need to be invited or added as a collaborator.");
                }
            }
            else {
                if (!this.hasProjectAccess(project, userId)) {
                    throw new common_1.ForbiddenException("You don't have access to this project");
                }
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
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const project = queryRunner.manager.create(project_entity_1.Project, {
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
            });
            if (createProjectDto.collaborator_ids?.length) {
                const collaborators = await this.getValidatedCollaborators(createProjectDto.collaborator_ids);
                project.collaborators = collaborators;
            }
            const savedProject = await queryRunner.manager.save(project_entity_1.Project, project);
            const financialSummary = queryRunner.manager.create(project_financial_summary_entity_1.ProjectFinancialSummary, {
                project_id: savedProject.id,
                totalBudget: createProjectDto.totalAmount || 0,
                spentAmount: 0,
                allocatedBudget: 0,
                estimatedSavings: 0,
                financialStatus: "on_track",
                budgetLastUpdated: new Date(),
            });
            await queryRunner.manager.save(project_financial_summary_entity_1.ProjectFinancialSummary, financialSummary);
            const metadata = queryRunner.manager.create(project_metadata_entity_1.ProjectMetadata, {
                project_id: savedProject.id,
            });
            await queryRunner.manager.save(project_metadata_entity_1.ProjectMetadata, metadata);
            const settings = queryRunner.manager.create(project_settings_entity_1.ProjectSettings, {
                project_id: savedProject.id,
            });
            await queryRunner.manager.save(project_settings_entity_1.ProjectSettings, settings);
            await queryRunner.commitTransaction();
            try {
                await this.activitiesService.logProjectCreated(owner, savedProject, null);
            }
            catch (error) {
                console.error("Failed to log project creation activity:", error);
            }
            try {
                await this.dashboardService.updateStats();
            }
            catch (error) {
                console.error("Failed to update dashboard stats:", error);
            }
            return this.findOne(savedProject.id);
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    async update(id, updateProjectDto, userId) {
        const project = await this.findOne(id);
        const user = await this.usersService.findOne(userId);
        const isAdmin = user?.role === "consultant";
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
        const isAdmin = user?.role === "consultant";
        const isConsultant = user?.role === "consultant";
        if (project.owner_id !== userId && !isAdmin && !isConsultant) {
            throw new common_1.ForbiddenException("Only the project owner, admin, or consultant can delete the project");
        }
        await this.projectsRepository.remove(project);
        await this.dashboardService.updateStats();
    }
    async addCollaborator(projectId, collaborator, userId) {
        return this.projectCollaborationService.addCollaborator(projectId, collaborator, userId);
    }
    async removeCollaborator(projectId, collaboratorId, userId) {
        return this.projectCollaborationService.removeCollaborator(projectId, collaboratorId, userId);
    }
    async processBoqFile(projectId, file, userId) {
        return this.projectBoqService.processBoqFile(projectId, file, userId);
    }
    async processBoqFileFromParsedData(projectId, data, totalAmount, userId, file, type) {
        return this.projectBoqService.processBoqFileFromParsedData(projectId, data, totalAmount, userId, file?.originalname, file, type);
    }
    async createPhase(projectId, createPhaseDto, userId) {
        return this.projectPhaseService.createPhase(projectId, createPhaseDto, userId);
    }
    async updatePhase(projectId, phaseId, updatePhaseDto, userId) {
        return this.projectPhaseService.updatePhase(projectId, phaseId, updatePhaseDto, userId);
    }
    async deletePhase(projectId, phaseId, userId) {
        return this.projectPhaseService.deletePhase(projectId, phaseId, userId);
    }
    async getProjectPhases(projectId, userId) {
        return this.projectContractorService.getProjectPhases(projectId, userId);
    }
    async getProjectPhasesPaginated(projectId, userId, { page = 1, limit = 10 }) {
        const user = await this.usersService.findOne(userId);
        const userRole = user?.role?.toLowerCase();
        if (userRole === "contractor" || userRole === "sub_contractor") {
            return this.projectContractorService.getProjectPhasesPaginated(projectId, userId, { page, limit });
        }
        else {
            return this.projectPhaseService.getProjectPhasesPaginated(projectId, userId, { page, limit });
        }
    }
    async getContractorPhasesForLinking(projectId, userId) {
        return this.projectContractorService.getContractorPhasesForLinking(projectId, userId);
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
    async getProjectResponse(project, userId) {
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
            if (phase.status === "completed") {
                return 100;
            }
            else if (phase.status === "in_progress") {
                return 50;
            }
            else if (phase.status === "not_started") {
                return 0;
            }
            return 0;
        };
        const phases = project.phases || [];
        let projectProgress = 0;
        let completedPhases = 0;
        let totalPhases = 0;
        if (phases.length > 0) {
            projectProgress = Math.round(phases.reduce((sum, p) => sum + calculatePhaseCompletion(p), 0) /
                phases.length);
            completedPhases = phases.filter((p) => p.status === "completed").length;
            totalPhases = phases.length;
        }
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
            collaborators: (project.collaborators || []).map((c) => c.display_name || c.id),
            tags: project.tags,
            isOwner: isOwner,
            isCollaborator: isCollaborator,
            phases: phases.length > 0
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
        return this.projectCollaborationService.createJoinRequest(projectId, requesterId);
    }
    async listJoinRequestsForProject(projectId, ownerId) {
        return this.projectCollaborationService.listJoinRequestsForProject(projectId, ownerId);
    }
    async approveJoinRequest(projectId, requestId, ownerId) {
        return this.projectCollaborationService.approveJoinRequest(projectId, requestId, ownerId);
    }
    async denyJoinRequest(projectId, requestId, ownerId) {
        return this.projectCollaborationService.denyJoinRequest(projectId, requestId, ownerId);
    }
    async listMyJoinRequests(userId) {
        return this.projectCollaborationService.listMyJoinRequests(userId);
    }
    async listJoinRequestsForOwner(ownerId) {
        return this.projectCollaborationService.listJoinRequestsForOwner(ownerId);
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
                const progress = totalPhases > 0
                    ? Math.round((completedPhases / totalPhases) * 100)
                    : 0;
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
        const csvContent = file.buffer.toString("utf-8");
        const allLines = csvContent.split(/\r?\n/);
        if (allLines.length === 0) {
            throw new common_1.BadRequestException("CSV file is empty");
        }
        const lines = allLines.filter((line) => line.trim().length > 0 || line.includes(","));
        const headerLine = lines[0];
        const rawHeaders = this.parseCsvLine(headerLine).map((h) => h.trim());
        const headers = [];
        const chineseTranslationColumns = {};
        rawHeaders.forEach((header, index) => {
            const hasChinese = /[\u4e00-\u9fff]/.test(header);
            const hasEnglish = /[a-zA-Z]/.test(header);
            if (hasChinese && hasEnglish) {
                const englishPart = header.replace(/[\u4e00-\u9fff]/g, "").trim();
                const chinesePart = header.replace(/[a-zA-Z0-9\s]/g, "").trim();
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
        const rawData = lines
            .slice(1)
            .map((line, lineIndex) => {
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
                return { _parseError: true, _originalLineIndex: lineIndex + 2 };
            }
        })
            .filter((row) => !row._parseError);
        const columnMappings = this.getColumnMappingsFromHeaders(headers);
        const descriptionCol = columnMappings.descriptionCol;
        const quantityCol = columnMappings.quantityCol;
        const priceCol = columnMappings.priceCol;
        const filteredData = rawData.filter((row, index) => {
            const hasAnyContent = Object.entries(row).some(([key, val]) => {
                if (key.startsWith("_"))
                    return false;
                const str = val?.toString().trim() || "";
                return str.length > 0 && str !== "-" && str !== "—" && str !== "N/A";
            });
            if (!hasAnyContent) {
                return false;
            }
            if (descriptionCol && row[descriptionCol]) {
                const desc = (row[descriptionCol] || "")
                    .toString()
                    .toLowerCase()
                    .trim();
                const isClearlyInvalid = desc === "total" ||
                    desc === "sum" ||
                    desc === "subtotal" ||
                    desc === "grand total" ||
                    desc.startsWith("note:") ||
                    desc.startsWith("注意:") ||
                    desc.startsWith("instruction") ||
                    desc.startsWith("说明") ||
                    (desc.includes("合计") && desc.length < 10) ||
                    (desc.includes("总计") && desc.length < 10);
                if (isClearlyInvalid) {
                    return false;
                }
            }
            if (!descriptionCol ||
                !row[descriptionCol] ||
                row[descriptionCol].trim() === "") {
                const hasQuantity = quantityCol &&
                    row[quantityCol] &&
                    row[quantityCol].toString().trim() !== "";
                const hasPrice = priceCol && row[priceCol] && row[priceCol].toString().trim() !== "";
                if (hasQuantity || hasPrice) {
                    return true;
                }
            }
            return true;
        });
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
                return false;
            }
            const desc = row[descriptionCol];
            const hasDescription = desc && typeof desc === "string" && desc.trim() !== "";
            const hasQuantity = quantityCol &&
                row[quantityCol] &&
                this.parseAmountValue(row[quantityCol]) > 0;
            const hasPrice = priceCol && row[priceCol] && this.parseAmountValue(row[priceCol]) > 0;
            if (hasDescription || hasQuantity || hasPrice) {
                return true;
            }
            return false;
        });
        let totalAmount = 0;
        if (totalPriceCol) {
            totalAmount = validData.reduce((sum, row) => {
                const amount = this.parseAmountValue(row[totalPriceCol]) || 0;
                return sum + amount;
            }, 0);
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
            else if (char === "," && !inQuotes) {
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
            const hasQuantity = quantityCol &&
                row[quantityCol] &&
                this.parseAmountValue(row[quantityCol]) > 0;
            const hasPrice = priceCol && row[priceCol] && this.parseAmountValue(row[priceCol]) > 0;
            if (hasQuantity || hasPrice) {
                row.isMainSection = false;
                row.mainSection = currentMainSection;
            }
            else {
                const isAllCaps = description === description.toUpperCase() && description.length < 30;
                const startsWithNumber = /^\d+[\.\)]\s*[A-Z]/.test(description);
                const isVeryShort = description.length < 30;
                if ((isAllCaps || startsWithNumber) &&
                    isVeryShort &&
                    description.length > 0) {
                    currentMainSection = description;
                    currentSubSection = null;
                    row.isMainSection = true;
                    row.mainSection = description;
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
            .replace(/[^\d.-]/g, "")
            .replace(/,/g, "");
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
        if (!projectId || projectId.trim() === "") {
            const error = "❌ CRITICAL: Project ID is required when creating phases from BOQ data";
            throw new Error(error);
        }
        if (!data || data.length === 0) {
            return [];
        }
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
        const totalDays = Math.max(1, Math.ceil((projectEndDate.getTime() - projectStartDate.getTime()) /
            (1000 * 60 * 60 * 24)));
        const phases = [];
        const daysPerPhase = totalDays / Math.max(data.length, 1);
        for (let i = 0; i < data.length; i++) {
            const item = data[i];
            if (!item) {
                continue;
            }
            const itemDescription = item.description ||
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
            const phaseStartDate = new Date(projectStartDate);
            phaseStartDate.setDate(phaseStartDate.getDate() + i * daysPerPhase);
            const phaseEndDate = new Date(phaseStartDate);
            phaseEndDate.setDate(phaseEndDate.getDate() + daysPerPhase);
            const itemUnit = item.unit ||
                item.Unit ||
                item._extractedUnit ||
                (item.rawData && (item.rawData.unit || item.rawData.Unit)) ||
                "";
            const itemQuantity = item.quantity !== undefined && item.quantity !== null
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
                                    : parseFloat(String(item.rawData.quantity || item.rawData.Quantity || 0))
                            : 0;
            const itemRate = item.rate !== undefined && item.rate !== null
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
                                    : parseFloat(String(item.rawData.rate ||
                                        item.rawData["Rate ($)"] ||
                                        item.rawData.Rate ||
                                        0))
                        : 0;
            const itemAmount = item.amount !== undefined && item.amount !== null
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
                                    : parseFloat(String(item.rawData.amount ||
                                        item.rawData["Amount ($)"] ||
                                        item.rawData.Amount ||
                                        0))
                        : 0;
            const itemSection = item.section || item.Section || "";
            const phaseDescription = [
                itemSection ? `Section: ${itemSection}` : null,
                itemUnit ? `Unit: ${itemUnit}` : null,
                itemQuantity ? `Quantity: ${itemQuantity}` : null,
                itemRate > 0 ? `Rate: ${itemRate}` : null,
            ]
                .filter(Boolean)
                .join(" | ");
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
            if (!phaseData.project_id || phaseData.project_id.trim() === "") {
                const error = `❌ CRITICAL: Phase "${itemDescription}" has no projectId`;
                throw new Error(error);
            }
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
                    null,
                ]);
                if (!result || result.length === 0) {
                    throw new Error(`Failed to create phase: ${itemDescription}`);
                }
                const savedPhase = await this.phasesRepository.findOne({
                    where: { id: result[0].id },
                    relations: ["project"],
                });
                if (!savedPhase) {
                    throw new Error(`Failed to retrieve created phase: ${itemDescription}`);
                }
                if (savedPhase.project_id !== projectId) {
                    const error = `❌ CRITICAL: Phase "${savedPhase.title}" has incorrect project_id: ${savedPhase.project_id}, expected: ${projectId}`;
                    throw new Error(error);
                }
                phases.push(savedPhase);
            }
            catch (error) {
                throw error;
            }
        }
        for (const phase of phases) {
            if (!phase.project_id || phase.project_id !== projectId) {
                const error = `❌ CRITICAL: Phase "${phase.title}" (${phase.id}) has incorrect project_id: ${phase.project_id}, expected: ${projectId}`;
                throw new Error(error);
            }
        }
        return phases;
    }
    async createTasksFromBoqData(data, projectId) {
        const rowKeys = data.length > 0 ? Object.keys(data[0]) : [];
        const columnMappings = this.getColumnMappingsFromHeaders(rowKeys);
        const { descriptionCol, unitCol, quantityCol, priceCol } = columnMappings;
        const tasks = [];
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
            }
        }
        return tasks;
    }
    async previewBoqFile(file) {
        return this.projectBoqService.previewBoqFile(file);
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
    async getAllConsultantProjectsPaginated(userId, page = 1, limit = 10, search, status) {
        return this.projectConsultantService.getAllConsultantProjectsPaginated(userId, page, limit, search, status);
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
        return this.projectPhaseService.getBoqDraftPhases(projectId, userId);
    }
    async activateBoqPhases(projectId, phaseIds, userId, linkedContractorPhaseId) {
        return this.projectPhaseService.activateBoqPhases(projectId, phaseIds, userId, linkedContractorPhaseId);
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
    async getProjectBoqs(projectId, userId) {
        await this.findOne(projectId, userId);
        const user = await this.usersService.findOne(userId);
        const userRole = user?.role?.toLowerCase();
        const whereClause = { project_id: projectId };
        if (userRole === "contractor") {
            whereClause.type = "contractor";
        }
        else if (userRole === "sub_contractor") {
            whereClause.type = "sub_contractor";
        }
        const boqs = await this.projectBoqRepository.find({
            where: whereClause,
            order: { created_at: "ASC" },
        });
        return boqs.map((boq) => ({
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
    __param(6, (0, typeorm_1.InjectRepository)(project_boq_entity_1.ProjectBoq)),
    __param(7, (0, typeorm_1.InjectRepository)(project_financial_summary_entity_1.ProjectFinancialSummary)),
    __param(8, (0, typeorm_1.InjectRepository)(project_metadata_entity_1.ProjectMetadata)),
    __param(9, (0, typeorm_1.InjectRepository)(project_settings_entity_1.ProjectSettings)),
    __param(11, (0, common_1.Inject)((0, common_1.forwardRef)(() => activities_service_1.ActivitiesService))),
    __param(13, (0, common_1.Inject)((0, common_1.forwardRef)(() => dashboard_service_1.DashboardService))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
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
        project_contractor_service_1.ProjectContractorService,
        project_phase_service_1.ProjectPhaseService,
        project_boq_service_1.ProjectBoqService,
        project_collaboration_service_1.ProjectCollaborationService,
        typeorm_2.DataSource])
], ProjectsService);
//# sourceMappingURL=projects.service.js.map