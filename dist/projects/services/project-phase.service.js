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
const project_entity_1 = require("../../entities/project.entity");
const task_entity_1 = require("../../entities/task.entity");
const users_service_1 = require("../../users/users.service");
const activities_service_1 = require("../../activities/activities.service");
const activity_entity_1 = require("../../entities/activity.entity");
const projects_service_1 = require("../projects.service");
let ProjectPhaseService = class ProjectPhaseService {
    constructor(phasesRepository, projectsRepository, tasksRepository, usersService, activitiesService, projectsService) {
        this.phasesRepository = phasesRepository;
        this.projectsRepository = projectsRepository;
        this.tasksRepository = tasksRepository;
        this.usersService = usersService;
        this.activitiesService = activitiesService;
        this.projectsService = projectsService;
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
        const phase = this.phasesRepository.create({
            ...phaseData,
            project: project,
        });
        if (!phase.project_id) {
            throw new common_1.BadRequestException("Phase must have a valid project_id");
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
        const isAdmin = user?.role === "admin";
        const isConsultant = user?.role === "consultant";
        const isOwner = project.owner_id === userId;
        if (!isOwner &&
            !isContractor &&
            !isSubContractor &&
            !isAdmin &&
            !isConsultant) {
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
            phase.project_id = projectId;
        }
        Object.assign(phase, updateData);
        if (!phase.project_id || phase.project_id.trim() === "") {
            throw new common_1.BadRequestException("Phase must have a valid project_id");
        }
        const updatedPhase = await this.phasesRepository.save(phase);
        await this.activitiesService.createActivity(activity_entity_1.ActivityType.TASK_UPDATED, `Phase "${updatedPhase.title}" was updated`, user, project, updatedPhase, { phaseId: updatedPhase.id });
        if (updatePhaseDto.status === "completed" &&
            phase.status !== "completed") {
            const allPhases = await this.phasesRepository.find({
                where: { project_id: projectId },
            });
            const phaseNumber = allPhases.findIndex((p) => p.id === phaseId) + 1;
            const totalPhases = allPhases.length;
            await this.activitiesService.logPhaseCompleted(user, project, updatedPhase, phaseNumber, totalPhases);
            if (updatedPhase.end_date &&
                new Date(updatedPhase.end_date) < new Date()) {
                await this.activitiesService.logPhaseOverdue(user, project, updatedPhase, phaseNumber, totalPhases);
            }
        }
        return updatedPhase;
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
        const isAdmin = user?.role === "admin";
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
    async getBoqDraftPhases(projectId, userId) {
        await this.projectsService.findOne(projectId, userId);
        return this.phasesRepository.find({
            where: { project_id: projectId, from_boq: true, is_active: false },
            order: { created_at: "ASC" },
        });
    }
    async activateBoqPhases(projectId, phaseIds, userId) {
        const project = await this.projectsService.findOne(projectId, userId);
        if (!phaseIds || phaseIds.length === 0) {
            throw new common_1.BadRequestException("No phase IDs provided");
        }
        const activatedPhases = [];
        for (const phaseId of phaseIds) {
            const phase = await this.phasesRepository.findOne({
                where: {
                    id: phaseId,
                    project_id: projectId,
                    from_boq: true,
                },
            });
            if (!phase) {
                continue;
            }
            phase.is_active = true;
            await this.phasesRepository.save(phase);
            activatedPhases.push(phase);
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
    async createPhasesFromBoqData(data, projectId, userId) {
        const project = await this.projectsRepository.findOne({
            where: { id: projectId },
        });
        if (!project) {
            throw new common_1.NotFoundException(`Project with ID ${projectId} not found`);
        }
        const phases = [];
        const projectStartDate = project.start_date
            ? new Date(project.start_date)
            : new Date();
        const projectEndDate = project.end_date
            ? new Date(project.end_date)
            : new Date();
        const totalDays = Math.max(1, Math.ceil((projectEndDate.getTime() - projectStartDate.getTime()) /
            (1000 * 60 * 60 * 24)));
        for (const row of data) {
            const description = row.Description || row.description || "";
            const unit = row.Unit || row.unit || "";
            const quantity = parseFloat(String(row.Quantity || row.quantity || 0)) || 0;
            const price = parseFloat(String(row.Price || row.price || 0)) || 0;
            const totalPrice = parseFloat(String(row["Total Price"] || row.totalPrice || 0)) || 0;
            const phaseData = {
                title: description || "Untitled Phase",
                description: `Unit: ${unit}, Quantity: ${quantity}`,
                budget: totalPrice || quantity * price,
                project_id: projectId,
                from_boq: true,
                is_active: false,
                status: phase_entity_1.PhaseStatus.NOT_STARTED,
                start_date: projectStartDate,
                end_date: projectEndDate,
            };
            const phase = this.phasesRepository.create({
                ...phaseData,
                project: project,
            });
            const savedPhase = await this.phasesRepository.save(phase);
            phases.push(savedPhase);
        }
        return phases;
    }
};
exports.ProjectPhaseService = ProjectPhaseService;
exports.ProjectPhaseService = ProjectPhaseService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(phase_entity_1.Phase)),
    __param(1, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __param(2, (0, typeorm_1.InjectRepository)(task_entity_1.Task)),
    __param(4, (0, common_1.Inject)((0, common_1.forwardRef)(() => activities_service_1.ActivitiesService))),
    __param(5, (0, common_1.Inject)((0, common_1.forwardRef)(() => projects_service_1.ProjectsService))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        users_service_1.UsersService,
        activities_service_1.ActivitiesService,
        projects_service_1.ProjectsService])
], ProjectPhaseService);
//# sourceMappingURL=project-phase.service.js.map