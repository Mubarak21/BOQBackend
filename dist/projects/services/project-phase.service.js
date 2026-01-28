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
exports.ProjectPhaseService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const phase_entity_1 = require("../../entities/phase.entity");
const contractor_phase_entity_1 = require("../../entities/contractor-phase.entity");
const sub_contractor_phase_entity_1 = require("../../entities/sub-contractor-phase.entity");
const project_entity_1 = require("../../entities/project.entity");
const task_entity_1 = require("../../entities/task.entity");
const users_service_1 = require("../../users/users.service");
const activities_service_1 = require("../../activities/activities.service");
const activity_entity_1 = require("../../entities/activity.entity");
const projects_service_1 = require("../projects.service");
let ProjectPhaseService = class ProjectPhaseService {
    constructor(phasesRepository, contractorPhasesRepository, subContractorPhasesRepository, projectsRepository, tasksRepository, usersService, activitiesService, projectsService, dataSource) {
        this.phasesRepository = phasesRepository;
        this.contractorPhasesRepository = contractorPhasesRepository;
        this.subContractorPhasesRepository = subContractorPhasesRepository;
        this.projectsRepository = projectsRepository;
        this.tasksRepository = tasksRepository;
        this.usersService = usersService;
        this.activitiesService = activitiesService;
        this.projectsService = projectsService;
        this.dataSource = dataSource;
    }
    async createPhase(projectId, createPhaseDto, userId) {
        if (!projectId || projectId.trim() === "") {
            throw new common_1.BadRequestException("Project ID is required when creating a phase");
        }
        const project = await this.projectsService.findOne(projectId, userId);
        if (!project || !project.id) {
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
            if ((!status || status === phase_entity_1.PhaseStatus.NOT_STARTED) &&
                startDate <= today) {
                status = phase_entity_1.PhaseStatus.IN_PROGRESS;
            }
        }
        if (!projectId || projectId.trim() === "") {
            throw new common_1.BadRequestException("Project ID is required when creating a phase");
        }
        const user = await this.usersService.findOne(userId);
        const userRole = user?.role?.toLowerCase();
        let boqType = null;
        if (userRole === 'contractor') {
            boqType = 'contractor';
        }
        else if (userRole === 'sub_contractor') {
            boqType = 'sub_contractor';
        }
        let linkedContractorPhaseId = null;
        if (createPhaseDto.linkedContractorPhaseId) {
            if (userRole !== 'sub_contractor') {
                throw new common_1.BadRequestException("Only sub-contractors can link phases to contractor phases");
            }
            const contractorPhase = await this.contractorPhasesRepository.findOne({
                where: {
                    id: createPhaseDto.linkedContractorPhaseId,
                    project_id: projectId,
                },
            });
            if (!contractorPhase) {
                const legacyPhase = await this.phasesRepository.findOne({
                    where: {
                        id: createPhaseDto.linkedContractorPhaseId,
                        project_id: projectId,
                        boqType: 'contractor',
                    },
                });
                if (!legacyPhase) {
                    throw new common_1.NotFoundException("Contractor phase not found or does not belong to this project");
                }
            }
            linkedContractorPhaseId = createPhaseDto.linkedContractorPhaseId;
        }
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
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
                project_id: projectId,
                is_active: true,
                from_boq: false,
            };
            let savedPhase;
            if (userRole === 'contractor') {
                const contractorPhase = queryRunner.manager.create(contractor_phase_entity_1.ContractorPhase, {
                    ...phaseData,
                    project: project,
                });
                savedPhase = await queryRunner.manager.save(contractor_phase_entity_1.ContractorPhase, contractorPhase);
            }
            else if (userRole === 'sub_contractor') {
                const subContractorPhase = queryRunner.manager.create(sub_contractor_phase_entity_1.SubContractorPhase, {
                    ...phaseData,
                    project: project,
                    linkedContractorPhaseId: linkedContractorPhaseId,
                });
                savedPhase = await queryRunner.manager.save(sub_contractor_phase_entity_1.SubContractorPhase, subContractorPhase);
            }
            else {
                const phaseDataLegacy = {
                    ...phaseData,
                    boqType,
                    linked_contractor_phase_id: linkedContractorPhaseId,
                    parent_phase_id: createPhaseDto.parentPhaseId || null,
                    reference_task_id: createPhaseDto.referenceTaskId || null,
                    project: project,
                };
                const phase = queryRunner.manager.create(phase_entity_1.Phase, phaseDataLegacy);
                savedPhase = await queryRunner.manager.save(phase_entity_1.Phase, phase);
            }
            if (createPhaseDto.tasks?.length) {
                for (const taskDto of createPhaseDto.tasks) {
                    if (taskDto.id) {
                        const updateData = { project_id: projectId };
                        if (userRole === 'contractor') {
                            updateData.contractorPhaseId = savedPhase.id;
                        }
                        else if (userRole === 'sub_contractor') {
                            updateData.subContractorPhaseId = savedPhase.id;
                        }
                        else {
                            updateData.phase_id = savedPhase.id;
                        }
                        await queryRunner.manager.update(task_entity_1.Task, { id: taskDto.id }, updateData);
                    }
                    else {
                        const taskData = {
                            ...taskDto,
                            project_id: projectId,
                        };
                        if (userRole === 'contractor') {
                            taskData.contractorPhaseId = savedPhase.id;
                        }
                        else if (userRole === 'sub_contractor') {
                            taskData.subContractorPhaseId = savedPhase.id;
                        }
                        else {
                            taskData.phase_id = savedPhase.id;
                        }
                        const newTask = queryRunner.manager.create(task_entity_1.Task, taskData);
                        await queryRunner.manager.save(task_entity_1.Task, newTask);
                    }
                }
            }
            await queryRunner.commitTransaction();
            try {
                await this.activitiesService.createActivity(activity_entity_1.ActivityType.TASK_CREATED, `Phase "${savedPhase.title}" was created`, user, project, savedPhase, { phaseId: savedPhase.id });
            }
            catch (activityError) {
                console.error('Failed to log activity:', activityError);
            }
            return this.normalizePhaseResponse(savedPhase);
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    normalizePhaseResponse(phase) {
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
        };
    }
    async updatePhase(projectId, phaseId, updatePhaseDto, userId) {
        if (!projectId || projectId.trim() === "") {
            throw new common_1.BadRequestException("Project ID is required when updating a phase");
        }
        const project = await this.projectsRepository.findOne({
            where: { id: projectId },
        });
        if (!project)
            throw new common_1.NotFoundException("Project not found");
        const user = await this.usersService.findOne(userId);
        const isContractor = user?.role === "contractor";
        const isSubContractor = user?.role === "sub_contractor";
        const isAdmin = user?.role === "consultant";
        const isConsultant = user?.role === "consultant";
        const isOwner = project.owner_id === userId;
        if (!isOwner &&
            !isContractor &&
            !isSubContractor &&
            !isAdmin &&
            !isConsultant) {
            throw new common_1.ForbiddenException("Only the project owner, contractor, sub_contractor, admin, or consultant can update a phase");
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
        Object.keys(updateData).forEach(key => {
            if (updateData[key] === undefined) {
                delete updateData[key];
            }
        });
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            let contractorPhase = await queryRunner.manager.findOne(contractor_phase_entity_1.ContractorPhase, {
                where: { id: phaseId, project_id: projectId },
                relations: ["linkedSubContractorPhases"],
            });
            let subContractorPhase = await queryRunner.manager.findOne(sub_contractor_phase_entity_1.SubContractorPhase, {
                where: { id: phaseId, project_id: projectId },
                relations: ["linkedContractorPhase"],
            });
            let legacyPhase = await queryRunner.manager.findOne(phase_entity_1.Phase, {
                where: { id: phaseId, project_id: projectId },
            });
            let updatedPhase;
            let phaseType = 'legacy';
            if (contractorPhase) {
                phaseType = 'contractor';
                Object.assign(contractorPhase, updateData);
                if (!contractorPhase.project_id) {
                    contractorPhase.project_id = projectId;
                }
                updatedPhase = await queryRunner.manager.save(contractor_phase_entity_1.ContractorPhase, contractorPhase);
                if (updatePhaseDto.status !== undefined || updatePhaseDto.progress !== undefined ||
                    updatePhaseDto.startDate !== undefined || updatePhaseDto.endDate !== undefined) {
                    const linkedSubContractorPhases = await queryRunner.manager.find(sub_contractor_phase_entity_1.SubContractorPhase, {
                        where: {
                            project_id: projectId,
                            linkedContractorPhaseId: phaseId,
                            is_active: true,
                        },
                    });
                    for (const linkedPhase of linkedSubContractorPhases) {
                        if (updatePhaseDto.status === 'completed' && linkedPhase.status !== phase_entity_1.PhaseStatus.COMPLETED) {
                            linkedPhase.status = phase_entity_1.PhaseStatus.COMPLETED;
                        }
                        if (updatePhaseDto.progress !== undefined && linkedPhase.progress > updatePhaseDto.progress) {
                            linkedPhase.progress = updatePhaseDto.progress;
                        }
                        if (updatePhaseDto.startDate !== undefined) {
                            linkedPhase.start_date = updatePhaseDto.startDate ? new Date(updatePhaseDto.startDate) : null;
                        }
                        if (updatePhaseDto.endDate !== undefined) {
                            linkedPhase.end_date = updatePhaseDto.endDate ? new Date(updatePhaseDto.endDate) : null;
                        }
                        await queryRunner.manager.save(sub_contractor_phase_entity_1.SubContractorPhase, linkedPhase);
                    }
                }
            }
            else if (subContractorPhase) {
                phaseType = 'sub_contractor';
                Object.assign(subContractorPhase, updateData);
                if (!subContractorPhase.project_id) {
                    subContractorPhase.project_id = projectId;
                }
                updatedPhase = await queryRunner.manager.save(sub_contractor_phase_entity_1.SubContractorPhase, subContractorPhase);
                if (subContractorPhase.linkedContractorPhaseId) {
                    const linkedContractorPhase = await queryRunner.manager.findOne(contractor_phase_entity_1.ContractorPhase, {
                        where: { id: subContractorPhase.linkedContractorPhaseId, project_id: projectId },
                    });
                    if (linkedContractorPhase) {
                        if (updatePhaseDto.status === 'completed') {
                            const allLinkedSubContractorPhases = await queryRunner.manager.find(sub_contractor_phase_entity_1.SubContractorPhase, {
                                where: {
                                    project_id: projectId,
                                    linkedContractorPhaseId: subContractorPhase.linkedContractorPhaseId,
                                    is_active: true,
                                },
                            });
                            const allCompleted = allLinkedSubContractorPhases.every(p => p.status === phase_entity_1.PhaseStatus.COMPLETED);
                            if (allCompleted && linkedContractorPhase.status !== phase_entity_1.PhaseStatus.COMPLETED) {
                                linkedContractorPhase.status = phase_entity_1.PhaseStatus.COMPLETED;
                                linkedContractorPhase.progress = 100;
                            }
                            else {
                                const completedCount = allLinkedSubContractorPhases.filter(p => p.status === phase_entity_1.PhaseStatus.COMPLETED).length;
                                linkedContractorPhase.progress = Math.min(100, (completedCount / allLinkedSubContractorPhases.length) * 100);
                            }
                            await queryRunner.manager.save(contractor_phase_entity_1.ContractorPhase, linkedContractorPhase);
                        }
                        else if (updatePhaseDto.progress !== undefined) {
                            const allLinkedSubContractorPhases = await queryRunner.manager.find(sub_contractor_phase_entity_1.SubContractorPhase, {
                                where: {
                                    project_id: projectId,
                                    linkedContractorPhaseId: subContractorPhase.linkedContractorPhaseId,
                                    is_active: true,
                                },
                            });
                            const avgProgress = allLinkedSubContractorPhases.reduce((sum, p) => sum + (p.progress || 0), 0) / allLinkedSubContractorPhases.length;
                            linkedContractorPhase.progress = Math.min(100, avgProgress);
                            await queryRunner.manager.save(contractor_phase_entity_1.ContractorPhase, linkedContractorPhase);
                        }
                    }
                }
            }
            else if (legacyPhase) {
                phaseType = 'legacy';
                Object.assign(legacyPhase, updateData);
                if (!legacyPhase.project_id) {
                    legacyPhase.project_id = projectId;
                }
                updatedPhase = await queryRunner.manager.save(phase_entity_1.Phase, legacyPhase);
            }
            else {
                throw new common_1.NotFoundException("Phase not found");
            }
            if (!updatedPhase.project_id || updatedPhase.project_id.trim() === "") {
                throw new common_1.BadRequestException("Phase must have a valid project_id");
            }
            await queryRunner.commitTransaction();
            try {
                await this.activitiesService.createActivity(activity_entity_1.ActivityType.TASK_UPDATED, `Phase "${updatedPhase.title || updatedPhase.name}" was updated`, user, project, updatedPhase, { phaseId: updatedPhase.id });
            }
            catch (activityError) {
                console.error('Failed to log activity:', activityError);
            }
            if (updatePhaseDto.status === "completed" &&
                (phaseType === 'contractor' ? contractorPhase?.status :
                    phaseType === 'sub_contractor' ? subContractorPhase?.status : legacyPhase?.status) !== "completed") {
                try {
                    let allPhases = [];
                    if (phaseType === 'contractor') {
                        allPhases = await this.contractorPhasesRepository.find({
                            where: { project_id: projectId },
                        });
                    }
                    else if (phaseType === 'sub_contractor') {
                        allPhases = await this.subContractorPhasesRepository.find({
                            where: { project_id: projectId },
                        });
                    }
                    else {
                        allPhases = await this.phasesRepository.find({
                            where: { project_id: projectId },
                        });
                    }
                    const phaseNumber = allPhases.findIndex((p) => p.id === phaseId) + 1;
                    const totalPhases = allPhases.length;
                    await this.activitiesService.logPhaseCompleted(user, project, updatedPhase, phaseNumber, totalPhases);
                    if (updatedPhase.end_date &&
                        new Date(updatedPhase.end_date) < new Date()) {
                        await this.activitiesService.logPhaseOverdue(user, project, updatedPhase, phaseNumber, totalPhases);
                    }
                }
                catch (activityError) {
                    console.error('Failed to log phase completion:', activityError);
                }
            }
            return this.normalizePhaseResponse(updatedPhase);
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    async deletePhase(projectId, phaseId, userId) {
        if (!projectId || projectId.trim() === "") {
            throw new common_1.BadRequestException("Project ID is required when deleting a phase");
        }
        const project = await this.projectsRepository.findOne({
            where: { id: projectId },
        });
        if (!project)
            throw new common_1.NotFoundException("Project not found");
        const user = await this.usersService.findOne(userId);
        const isContractor = user?.role === "contractor";
        const isSubContractor = user?.role === "sub_contractor";
        const isAdmin = user?.role === "consultant";
        const isConsultant = user?.role === "consultant";
        const isOwner = project.owner_id === userId;
        if (!isOwner &&
            !isContractor &&
            !isSubContractor &&
            !isAdmin &&
            !isConsultant) {
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
    async getProjectPhasesPaginated(projectId, userId, { page = 1, limit = 10 }) {
        const user = await this.usersService.findOne(userId);
        const isContractor = user?.role === "contractor";
        const isSubContractor = user?.role === "sub_contractor";
        const userRole = user?.role?.toLowerCase();
        if (!isContractor && !isSubContractor) {
            await this.projectsService.findOne(projectId, userId);
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
        let allPhases = [];
        if (userRole === 'contractor') {
            const contractorPhases = await this.phasesRepository.find({
                where: { project_id: projectId, is_active: true, boqType: 'contractor' },
                relations: ["subPhases", "subPhases.subPhases", "linkedSubContractorPhases"],
                order: { created_at: "ASC" },
            });
            const contractorPhaseIds = contractorPhases.map(p => p.id);
            const linkedSubContractorPhases = contractorPhaseIds.length > 0
                ? await this.phasesRepository.find({
                    where: {
                        project_id: projectId,
                        is_active: true,
                        boqType: 'sub_contractor',
                        linkedContractorPhaseId: (0, typeorm_2.In)(contractorPhaseIds),
                    },
                    relations: ["subPhases", "subPhases.subPhases", "linkedContractorPhase"],
                    order: { created_at: "ASC" },
                })
                : [];
            allPhases = [...contractorPhases, ...linkedSubContractorPhases].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        }
        else if (userRole === 'sub_contractor') {
            const subContractorPhases = await this.phasesRepository.find({
                where: { project_id: projectId, is_active: true, boqType: 'sub_contractor' },
                relations: ["subPhases", "subPhases.subPhases", "linkedContractorPhase"],
                order: { created_at: "ASC" },
            });
            const linkedContractorPhaseIds = subContractorPhases
                .map(p => p.linkedContractorPhaseId)
                .filter(id => id !== null);
            const linkedContractorPhases = linkedContractorPhaseIds.length > 0
                ? await this.phasesRepository.find({
                    where: {
                        project_id: projectId,
                        is_active: true,
                        boqType: 'contractor',
                        id: (0, typeorm_2.In)(linkedContractorPhaseIds),
                    },
                    relations: ["subPhases", "subPhases.subPhases", "linkedSubContractorPhases"],
                    order: { created_at: "ASC" },
                })
                : [];
            allPhases = [...subContractorPhases, ...linkedContractorPhases].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        }
        else {
            allPhases = await this.phasesRepository.find({
                where: { project_id: projectId, is_active: true },
                relations: ["subPhases", "subPhases.subPhases", "linkedContractorPhase", "linkedSubContractorPhases"],
                order: { created_at: "ASC" },
            });
        }
        const total = allPhases.length;
        const paginatedItems = allPhases.slice((pageNum - 1) * limitNum, pageNum * limitNum);
        return {
            items: paginatedItems,
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
        };
    }
    async getBoqDraftPhases(projectId, userId) {
        await this.projectsService.findOne(projectId, userId);
        const user = await this.usersService.findOne(userId);
        const userRole = user?.role?.toLowerCase();
        if (userRole === 'contractor') {
            const contractorPhases = await this.contractorPhasesRepository.find({
                where: {
                    project_id: projectId,
                    from_boq: true,
                    is_active: false
                },
                relations: ["subPhases"],
                order: { created_at: "ASC" },
            });
            const legacyPhases = await this.phasesRepository
                .createQueryBuilder('phase')
                .where('phase.project_id = :projectId', { projectId })
                .andWhere('phase.from_boq = :fromBoq', { fromBoq: true })
                .andWhere('phase.is_active = :isActive', { isActive: false })
                .andWhere('(phase.boqType = :contractorType OR phase.boqType IS NULL)', { contractorType: 'contractor' })
                .orderBy('phase.created_at', 'ASC')
                .getMany();
            return [...contractorPhases, ...legacyPhases];
        }
        else if (userRole === 'sub_contractor') {
            const subContractorPhases = await this.subContractorPhasesRepository.find({
                where: {
                    project_id: projectId,
                    from_boq: true,
                    is_active: false
                },
                relations: ["subPhases"],
                order: { created_at: "ASC" },
            });
            const legacyPhases = await this.phasesRepository.find({
                where: {
                    project_id: projectId,
                    from_boq: true,
                    is_active: false,
                    boqType: 'sub_contractor'
                },
                order: { created_at: "ASC" },
            });
            return [...subContractorPhases, ...legacyPhases];
        }
        const contractorPhases = await this.contractorPhasesRepository.find({
            where: {
                project_id: projectId,
                from_boq: true,
                is_active: false
            },
            relations: ["subPhases"],
            order: { created_at: "ASC" },
        });
        const subContractorPhases = await this.subContractorPhasesRepository.find({
            where: {
                project_id: projectId,
                from_boq: true,
                is_active: false
            },
            relations: ["subPhases"],
            order: { created_at: "ASC" },
        });
        const legacyPhases = await this.phasesRepository.find({
            where: {
                project_id: projectId,
                from_boq: true,
                is_active: false
            },
            order: { created_at: "ASC" },
        });
        return [...contractorPhases, ...subContractorPhases, ...legacyPhases];
    }
    async activateBoqPhases(projectId, phaseIds, userId, linkedContractorPhaseId) {
        const project = await this.projectsService.findOne(projectId, userId);
        if (!phaseIds || phaseIds.length === 0) {
            throw new common_1.BadRequestException("No phase IDs provided");
        }
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const activatedPhases = [];
            for (const phaseId of phaseIds) {
                const contractorPhase = await queryRunner.manager.findOne(contractor_phase_entity_1.ContractorPhase, {
                    where: {
                        id: phaseId,
                        project_id: projectId,
                        from_boq: true,
                    },
                });
                if (contractorPhase) {
                    contractorPhase.is_active = true;
                    await queryRunner.manager.save(contractor_phase_entity_1.ContractorPhase, contractorPhase);
                    activatedPhases.push(contractorPhase);
                    continue;
                }
                const subContractorPhase = await queryRunner.manager.findOne(sub_contractor_phase_entity_1.SubContractorPhase, {
                    where: {
                        id: phaseId,
                        project_id: projectId,
                        from_boq: true,
                    },
                });
                if (subContractorPhase) {
                    subContractorPhase.is_active = true;
                    if (linkedContractorPhaseId) {
                        subContractorPhase.linkedContractorPhaseId = linkedContractorPhaseId;
                    }
                    await queryRunner.manager.save(sub_contractor_phase_entity_1.SubContractorPhase, subContractorPhase);
                    activatedPhases.push(subContractorPhase);
                    continue;
                }
                const legacyPhase = await queryRunner.manager.findOne(phase_entity_1.Phase, {
                    where: {
                        id: phaseId,
                        project_id: projectId,
                        from_boq: true,
                    },
                });
                if (legacyPhase) {
                    legacyPhase.is_active = true;
                    await queryRunner.manager.save(phase_entity_1.Phase, legacyPhase);
                    activatedPhases.push(legacyPhase);
                }
            }
            await queryRunner.commitTransaction();
            try {
                const user = await this.usersService.findOne(userId);
                const contractorCount = await this.contractorPhasesRepository.count({
                    where: { project_id: projectId, is_active: true },
                });
                const subContractorCount = await this.subContractorPhasesRepository.count({
                    where: { project_id: projectId, is_active: true },
                });
                const legacyCount = await this.phasesRepository.count({
                    where: { project_id: projectId, is_active: true },
                });
                const totalPhases = contractorCount + subContractorCount + legacyCount;
                for (let i = 0; i < activatedPhases.length; i++) {
                    const phase = activatedPhases[i];
                    try {
                        await this.activitiesService.logPhaseCreated(user, project, phase, totalPhases - activatedPhases.length + i + 1, totalPhases);
                    }
                    catch (err) {
                    }
                }
            }
            catch (error) {
            }
            return {
                activated: activatedPhases.length,
                phases: activatedPhases,
            };
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    async createPhasesFromBoqData(data, projectId, userId, boqType) {
        const project = await this.projectsRepository.findOne({
            where: { id: projectId },
        });
        if (!project) {
            throw new common_1.NotFoundException(`Project with ID ${projectId} not found`);
        }
        const projectStartDate = project.start_date
            ? new Date(project.start_date)
            : new Date();
        const projectEndDate = project.end_date
            ? new Date(project.end_date)
            : new Date();
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            if (boqType === 'sub_contractor') {
                const subContractorPhases = [];
                for (const row of data) {
                    const description = row._extractedDescription ||
                        row.Description ||
                        row.description ||
                        (row.rawData && (row.rawData.description || row.rawData.Description)) ||
                        "";
                    const unit = row._extractedUnit ||
                        row.Unit ||
                        row.unit ||
                        (row.rawData && (row.rawData.unit || row.rawData.Unit)) ||
                        "";
                    const quantity = row._extractedQuantity !== undefined ? row._extractedQuantity :
                        row.Quantity !== undefined ? parseFloat(String(row.Quantity)) :
                            row.quantity !== undefined ? parseFloat(String(row.quantity)) :
                                row.rawData && row.rawData.quantity !== undefined ? parseFloat(String(row.rawData.quantity)) :
                                    row.rawData && row.rawData.Quantity !== undefined ? parseFloat(String(row.rawData.Quantity)) :
                                        0;
                    const price = row.Price !== undefined ? parseFloat(String(row.Price)) :
                        row.price !== undefined ? parseFloat(String(row.price)) :
                            row.rate !== undefined ? parseFloat(String(row.rate)) :
                                row.Rate !== undefined ? parseFloat(String(row.Rate)) :
                                    row.rawData && row.rawData.price !== undefined ? parseFloat(String(row.rawData.price)) :
                                        row.rawData && row.rawData.Price !== undefined ? parseFloat(String(row.rawData.Price)) :
                                            0;
                    const totalPrice = row._extractedAmount !== undefined && row._extractedAmount !== null ? parseFloat(String(row._extractedAmount)) :
                        row.amount !== undefined && row.amount !== null ? parseFloat(String(row.amount)) :
                            row["Total Price"] !== undefined ? parseFloat(String(row["Total Price"])) :
                                row.totalPrice !== undefined ? parseFloat(String(row.totalPrice)) :
                                    row.Amount !== undefined ? parseFloat(String(row.Amount)) :
                                        row.rawData && row.rawData.amount !== undefined ? parseFloat(String(row.rawData.amount)) :
                                            row.rawData && row.rawData["Total Price"] !== undefined ? parseFloat(String(row.rawData["Total Price"])) :
                                                (quantity > 0 && price > 0) ? quantity * price : 0;
                    const section = row.section ||
                        row.Section ||
                        row._extractedSection ||
                        (row.rawData && (row.rawData.section || row.rawData.Section)) ||
                        "";
                    const descriptionParts = [];
                    if (section) {
                        descriptionParts.push(`Section: ${section}`);
                    }
                    if (unit) {
                        descriptionParts.push(`Unit: ${unit}`);
                    }
                    if (quantity) {
                        descriptionParts.push(`Quantity: ${quantity}`);
                    }
                    const phaseDescription = descriptionParts.length > 0
                        ? descriptionParts.join(" | ")
                        : `Unit: ${unit}, Quantity: ${quantity}`;
                    const phaseData = {
                        title: description.trim() || "Untitled Phase",
                        description: phaseDescription,
                        budget: totalPrice || quantity * price,
                        project_id: projectId,
                        from_boq: true,
                        is_active: false,
                        status: phase_entity_1.PhaseStatus.NOT_STARTED,
                        start_date: projectStartDate,
                        end_date: projectEndDate,
                        project: project,
                    };
                    const phase = queryRunner.manager.create(sub_contractor_phase_entity_1.SubContractorPhase, phaseData);
                    const savedPhase = await queryRunner.manager.save(sub_contractor_phase_entity_1.SubContractorPhase, phase);
                    subContractorPhases.push(savedPhase);
                }
                await queryRunner.commitTransaction();
                return subContractorPhases;
            }
            else {
                const contractorPhases = [];
                for (const row of data) {
                    const description = row._extractedDescription ||
                        row.Description ||
                        row.description ||
                        (row.rawData && (row.rawData.description || row.rawData.Description)) ||
                        "";
                    const unit = row._extractedUnit ||
                        row.Unit ||
                        row.unit ||
                        (row.rawData && (row.rawData.unit || row.rawData.Unit)) ||
                        "";
                    const quantity = row._extractedQuantity !== undefined ? row._extractedQuantity :
                        row.Quantity !== undefined ? parseFloat(String(row.Quantity)) :
                            row.quantity !== undefined ? parseFloat(String(row.quantity)) :
                                row.rawData && row.rawData.quantity !== undefined ? parseFloat(String(row.rawData.quantity)) :
                                    row.rawData && row.rawData.Quantity !== undefined ? parseFloat(String(row.rawData.Quantity)) :
                                        0;
                    const price = row._extractedRate !== undefined && row._extractedRate !== null ? parseFloat(String(row._extractedRate)) :
                        row.rate !== undefined && row.rate !== null ? parseFloat(String(row.rate)) :
                            row.Rate !== undefined ? parseFloat(String(row.Rate)) :
                                row.Price !== undefined ? parseFloat(String(row.Price)) :
                                    row.price !== undefined ? parseFloat(String(row.price)) :
                                        row.rawData && row.rawData.rate !== undefined ? parseFloat(String(row.rawData.rate)) :
                                            row.rawData && row.rawData.price !== undefined ? parseFloat(String(row.rawData.price)) :
                                                row.rawData && row.rawData.Price !== undefined ? parseFloat(String(row.rawData.Price)) :
                                                    0;
                    const totalPrice = row._extractedAmount !== undefined && row._extractedAmount !== null ? parseFloat(String(row._extractedAmount)) :
                        row.amount !== undefined && row.amount !== null ? parseFloat(String(row.amount)) :
                            row["Total Price"] !== undefined ? parseFloat(String(row["Total Price"])) :
                                row.totalPrice !== undefined ? parseFloat(String(row.totalPrice)) :
                                    row.Amount !== undefined ? parseFloat(String(row.Amount)) :
                                        row.rawData && row.rawData.amount !== undefined ? parseFloat(String(row.rawData.amount)) :
                                            row.rawData && row.rawData["Total Price"] !== undefined ? parseFloat(String(row.rawData["Total Price"])) :
                                                (quantity > 0 && price > 0) ? quantity * price : 0;
                    const section = row.section ||
                        row.Section ||
                        row._extractedSection ||
                        (row.rawData && (row.rawData.section || row.rawData.Section)) ||
                        "";
                    const descriptionParts = [];
                    if (section) {
                        descriptionParts.push(`Section: ${section}`);
                    }
                    if (unit) {
                        descriptionParts.push(`Unit: ${unit}`);
                    }
                    if (quantity) {
                        descriptionParts.push(`Quantity: ${quantity}`);
                    }
                    const phaseDescription = descriptionParts.length > 0
                        ? descriptionParts.join(" | ")
                        : `Unit: ${unit}, Quantity: ${quantity}`;
                    const phaseData = {
                        title: description.trim() || "Untitled Phase",
                        description: phaseDescription,
                        budget: totalPrice || quantity * price,
                        project_id: projectId,
                        from_boq: true,
                        is_active: false,
                        status: phase_entity_1.PhaseStatus.NOT_STARTED,
                        start_date: projectStartDate,
                        end_date: projectEndDate,
                        project: project,
                    };
                    const phase = queryRunner.manager.create(contractor_phase_entity_1.ContractorPhase, phaseData);
                    const savedPhase = await queryRunner.manager.save(contractor_phase_entity_1.ContractorPhase, phase);
                    contractorPhases.push(savedPhase);
                }
                await queryRunner.commitTransaction();
                return contractorPhases;
            }
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
};
exports.ProjectPhaseService = ProjectPhaseService;
exports.ProjectPhaseService = ProjectPhaseService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(phase_entity_1.Phase)),
    __param(1, (0, typeorm_1.InjectRepository)(contractor_phase_entity_1.ContractorPhase)),
    __param(2, (0, typeorm_1.InjectRepository)(sub_contractor_phase_entity_1.SubContractorPhase)),
    __param(3, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __param(4, (0, typeorm_1.InjectRepository)(task_entity_1.Task)),
    __param(6, (0, common_1.Inject)((0, common_1.forwardRef)(() => activities_service_1.ActivitiesService))),
    __param(7, (0, common_1.Inject)((0, common_1.forwardRef)(() => projects_service_1.ProjectsService))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        users_service_1.UsersService,
        activities_service_1.ActivitiesService,
        projects_service_1.ProjectsService,
        typeorm_2.DataSource])
], ProjectPhaseService);
//# sourceMappingURL=project-phase.service.js.map