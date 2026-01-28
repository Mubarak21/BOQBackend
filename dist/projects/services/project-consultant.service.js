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
exports.ProjectConsultantService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const project_entity_1 = require("../../entities/project.entity");
const phase_entity_1 = require("../../entities/phase.entity");
const projects_service_1 = require("../projects.service");
let ProjectConsultantService = class ProjectConsultantService {
    constructor(projectsRepository, phasesRepository, projectsService) {
        this.projectsRepository = projectsRepository;
        this.phasesRepository = phasesRepository;
        this.projectsService = projectsService;
    }
    async getAllConsultantProjects() {
        const projects = await this.projectsRepository.find({
            relations: ["phases", "phases.subPhases", "owner", "collaborators"],
        });
        const calculatePhaseCompletion = (phase) => {
            if (!phase.subPhases || phase.subPhases.length === 0) {
                return phase.progress || 0;
            }
            const completed = phase.subPhases.filter((sp) => sp.isCompleted).length;
            return Math.round((completed / phase.subPhases.length) * 100);
        };
        return projects.map((project) => {
            const phases = project.phases || [];
            const projectProgress = phases.length > 0
                ? Math.round(phases.reduce((sum, p) => sum + calculatePhaseCompletion(p), 0) /
                    phases.length)
                : 0;
            const completedPhases = phases.filter((p) => p.status === "completed").length;
            return {
                id: project.id,
                name: project.title,
                description: project.description,
                progress: projectProgress,
                completedPhases,
                totalPhases: phases.length,
                totalAmount: project.totalAmount,
                totalBudget: project.totalAmount,
                startDate: project.start_date,
                estimatedCompletion: project.end_date,
                owner: project.owner?.display_name || project.owner_id,
                collaborators: (project.collaborators || []).map((c) => c.display_name || c.id),
                tags: project.tags || [],
                phases: phases.map((phase) => ({
                    id: phase.id,
                    name: phase.title,
                    title: phase.title,
                    status: phase.status,
                    startDate: phase.start_date,
                    endDate: phase.end_date,
                    subPhases: (phase.subPhases || []).map((sub) => ({
                        id: sub.id,
                        title: sub.title,
                        description: sub.description,
                        isCompleted: sub.isCompleted,
                    })),
                })),
                isOwner: false,
                isCollaborator: true,
                hasPendingInvite: false,
            };
        });
    }
    async getAllConsultantProjectsPaginated(userId, page = 1, limit = 10, search, status) {
        console.log('[ProjectConsultantService] getAllConsultantProjectsPaginated - Starting:', {
            userId,
            page,
            limit,
            search,
            status
        });
        const pageNum = Number(page) || 1;
        const limitNum = Number(limit) || 10;
        const qb = this.projectsRepository
            .createQueryBuilder("project")
            .leftJoinAndSelect("project.phases", "phases")
            .leftJoinAndSelect("phases.subPhases", "subPhases")
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
        const [projects, total] = await qb.getManyAndCount();
        console.log('[ProjectConsultantService] getAllConsultantProjectsPaginated - Query result:', {
            userId,
            projectsFound: projects.length,
            total,
            page: pageNum,
            limit: limitNum
        });
        const calculatePhaseCompletion = (phase) => {
            if (!phase.subPhases || phase.subPhases.length === 0) {
                return phase.progress || 0;
            }
            const completed = phase.subPhases.filter((sp) => sp.isCompleted).length;
            return Math.round((completed / phase.subPhases.length) * 100);
        };
        const items = projects.map((project) => {
            const phases = project.phases || [];
            const projectProgress = phases.length > 0
                ? Math.round(phases.reduce((sum, p) => sum + calculatePhaseCompletion(p), 0) /
                    phases.length)
                : 0;
            const isOwner = project.owner_id === userId;
            const isCollaborator = project.collaborators?.some((c) => c.id === userId) || false;
            console.log('[ProjectConsultantService] Processing project:', {
                projectId: project.id,
                projectTitle: project.title,
                userId,
                isOwner,
                isCollaborator,
                ownerId: project.owner_id,
                collaborators: project.collaborators?.map(c => c.id) || []
            });
            return {
                id: project.id,
                name: project.title,
                title: project.title,
                description: project.description,
                progress: projectProgress,
                completedPhases: phases.filter((p) => p.status === "completed").length,
                totalPhases: phases.length,
                totalAmount: project.totalAmount,
                totalBudget: project.totalAmount,
                startDate: project.start_date,
                start_date: project.start_date,
                estimatedCompletion: project.end_date,
                end_date: project.end_date,
                status: project.status,
                owner: project.owner?.display_name || project.owner_id,
                collaborators: (project.collaborators || []).map((c) => c.display_name || c.id),
                tags: project.tags || [],
                isOwner: isOwner,
                isCollaborator: isCollaborator,
                hasPendingInvite: false,
            };
        });
        const result = {
            items,
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
        };
        console.log('[ProjectConsultantService] getAllConsultantProjectsPaginated - Completed:', {
            userId,
            itemsReturned: items.length,
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: result.totalPages
        });
        return result;
    }
    async getConsultantProjectDetails(id) {
        const project = await this.projectsService.findOne(id);
        const phases = project.phases || [];
        const calculatePhaseCompletion = (phase) => {
            if (!phase.subPhases || phase.subPhases.length === 0) {
                return phase.progress || 0;
            }
            const completed = phase.subPhases.filter((sp) => sp.isCompleted).length;
            return Math.round((completed / phase.subPhases.length) * 100);
        };
        const projectProgress = phases.length > 0
            ? Math.round(phases.reduce((sum, p) => sum + calculatePhaseCompletion(p), 0) /
                phases.length)
            : 0;
        return {
            id: project.id,
            name: project.title,
            title: project.title,
            description: project.description,
            progress: projectProgress,
            totalAmount: project.totalAmount,
            totalBudget: project.totalAmount,
            startDate: project.start_date,
            start_date: project.start_date,
            estimatedCompletion: project.end_date,
            end_date: project.end_date,
            status: project.status,
            budget: project.totalAmount,
            owner: project.owner?.display_name || project.owner_id,
            collaborators: (project.collaborators || []).map((c) => c.display_name || c.id),
            tags: project.tags || [],
        };
    }
    async getConsultantProjectPhases(projectId) {
        const phases = await this.phasesRepository.find({
            where: { project_id: projectId },
            relations: ["subPhases"],
            order: { created_at: "ASC" },
        });
        return phases.map((phase) => ({
            id: phase.id,
            name: phase.title,
            title: phase.title,
            description: phase.description,
            status: phase.status,
            budget: phase.budget,
            startDate: phase.start_date,
            endDate: phase.end_date,
            subPhases: (phase.subPhases || []).map((sub) => ({
                id: sub.id,
                title: sub.title,
                description: sub.description,
                isCompleted: sub.isCompleted,
            })),
        }));
    }
    async getConsultantProjectPhasesPaginated(projectId, page = 1, limit = 10) {
        const pageNum = Number(page) || 1;
        const limitNum = Number(limit) || 10;
        const [phases, total] = await this.phasesRepository.findAndCount({
            where: { project_id: projectId },
            relations: ["subPhases"],
            order: { created_at: "ASC" },
            skip: (pageNum - 1) * limitNum,
            take: limitNum,
        });
        const items = phases.map((phase) => ({
            id: phase.id,
            name: phase.title,
            title: phase.title,
            description: phase.description,
            status: phase.status,
            budget: phase.budget,
            startDate: phase.start_date,
            endDate: phase.end_date,
            subPhases: (phase.subPhases || []).map((sub) => ({
                id: sub.id,
                title: sub.title,
                description: sub.description,
                isCompleted: sub.isCompleted,
            })),
        }));
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
            where: {
                project_id: projectId,
                is_active: false,
                from_boq: true
            },
            relations: ["subPhases"],
            order: { created_at: "ASC" },
        });
    }
    async activateBoqPhases(projectId, phaseIds, userId) {
        return this.projectsService.activateBoqPhases(projectId, phaseIds, userId);
    }
    async getConsultantProjectTasks(projectId) {
        const project = await this.projectsRepository.findOne({
            where: { id: projectId },
        });
        if (!project) {
            throw new common_1.NotFoundException("Project not found");
        }
        const phases = await this.phasesRepository.find({
            where: { project_id: projectId },
            relations: ["tasks"],
        });
        const allTasks = phases.flatMap((phase) => phase.tasks.map((task) => ({
            id: task.id,
            description: task.description,
            unit: task.unit,
            quantity: task.quantity,
            price: task.price,
            phase_id: phase.id,
            phase_title: phase.title,
            created_at: task.created_at,
        })));
        return allTasks;
    }
};
exports.ProjectConsultantService = ProjectConsultantService;
exports.ProjectConsultantService = ProjectConsultantService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __param(1, (0, typeorm_1.InjectRepository)(phase_entity_1.Phase)),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => projects_service_1.ProjectsService))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        projects_service_1.ProjectsService])
], ProjectConsultantService);
//# sourceMappingURL=project-consultant.service.js.map