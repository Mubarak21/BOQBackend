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
exports.SubPhasesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const sub_phase_entity_1 = require("../entities/sub-phase.entity");
const activities_service_1 = require("../activities/activities.service");
const phase_entity_1 = require("../entities/phase.entity");
const project_entity_1 = require("../entities/project.entity");
const user_entity_1 = require("../entities/user.entity");
const activity_entity_1 = require("../entities/activity.entity");
const users_service_1 = require("../users/users.service");
let SubPhasesService = class SubPhasesService {
    constructor(subPhaseRepository, phaseRepository, projectRepository, activitiesService, usersService) {
        this.subPhaseRepository = subPhaseRepository;
        this.phaseRepository = phaseRepository;
        this.projectRepository = projectRepository;
        this.activitiesService = activitiesService;
        this.usersService = usersService;
    }
    async create(phaseId, createDto, user) {
        if (!user) {
            throw new common_1.ForbiddenException("User must be authenticated to create sub-phases");
        }
        const phase = await this.phaseRepository.findOne({
            where: { id: phaseId },
            relations: ["project", "project.owner", "project.collaborators"],
        });
        if (!phase)
            throw new common_1.NotFoundException("Phase not found");
        let parentSubPhase = null;
        if (createDto.parentSubPhaseId) {
            parentSubPhase = await this.subPhaseRepository.findOne({
                where: { id: createDto.parentSubPhaseId },
                relations: ["phase"],
            });
            if (!parentSubPhase) {
                throw new common_1.NotFoundException("Parent sub-phase not found");
            }
            if (parentSubPhase.phase_id !== phaseId) {
                throw new common_1.ForbiddenException("Parent sub-phase must belong to the same phase");
            }
        }
        const userWithRole = await this.usersService.findOne(user.id);
        const isSubContractor = userWithRole?.role === user_entity_1.UserRole.SUB_CONTRACTOR;
        const isContractor = userWithRole?.role === user_entity_1.UserRole.CONTRACTOR;
        const isAdmin = userWithRole?.role === user_entity_1.UserRole.CONSULTANT;
        const isConsultant = userWithRole?.role === user_entity_1.UserRole.CONSULTANT;
        const isOwner = phase.project?.owner_id === user.id;
        const isCollaborator = phase.project?.collaborators?.some((c) => c.id === user.id);
        if (createDto.parentSubPhaseId) {
            if (!isSubContractor && !isAdmin && !isConsultant && !isOwner) {
                throw new common_1.ForbiddenException("Only sub_contractors, project owners, admins, or consultants can create nested sub-phases");
            }
        }
        else {
            if (!isSubContractor &&
                !isContractor &&
                !isAdmin &&
                !isConsultant &&
                !isOwner &&
                !isCollaborator) {
                throw new common_1.ForbiddenException("Only sub_contractors, contractors, project owners, collaborators, admins, or consultants can create sub-phases");
            }
        }
        const subPhase = this.subPhaseRepository.create({
            title: createDto.title,
            description: createDto.description,
            phase_id: phaseId,
            parent_sub_phase_id: createDto.parentSubPhaseId || null,
            isCompleted: false,
        });
        const saved = await this.subPhaseRepository.save(subPhase);
        if (phase.project && user) {
            await this.activitiesService.createActivity(activity_entity_1.ActivityType.TASK_CREATED, `Sub-phase "${subPhase.title}" was added to phase "${phase.title}"`, user, phase.project, phase, { subPhaseId: saved.id });
        }
        return saved;
    }
    async update(id, update, user) {
        if (!user) {
            throw new common_1.ForbiddenException("User must be authenticated to update sub-phases");
        }
        const subPhase = await this.subPhaseRepository.findOne({
            where: { id },
            relations: [
                "phase",
                "phase.project",
                "phase.project.owner",
                "phase.project.collaborators",
                "subPhases"
            ],
        });
        if (!subPhase)
            throw new common_1.NotFoundException("SubPhase not found");
        const userWithRole = await this.usersService.findOne(user.id);
        const isSubContractor = userWithRole?.role === user_entity_1.UserRole.SUB_CONTRACTOR;
        const isContractor = userWithRole?.role === user_entity_1.UserRole.CONTRACTOR;
        const isAdmin = userWithRole?.role === user_entity_1.UserRole.CONSULTANT;
        const isConsultant = userWithRole?.role === user_entity_1.UserRole.CONSULTANT;
        const isOwner = subPhase.phase?.project?.owner_id === user.id;
        const isCollaborator = subPhase.phase?.project?.collaborators?.some((c) => c.id === user.id);
        if (!isSubContractor &&
            !isContractor &&
            !isAdmin &&
            !isConsultant &&
            !isOwner &&
            !isCollaborator) {
            throw new common_1.ForbiddenException("Only sub_contractors, contractors, project owners, collaborators, admins, or consultants can update sub-phases");
        }
        if (update.isCompleted === true && subPhase.isCompleted !== true) {
            const hasIncompleteNested = await this.hasIncompleteNestedSubPhases(id);
            if (hasIncompleteNested) {
                throw new common_1.ForbiddenException("Cannot mark sub-phase as completed. All nested sub-phases must be completed first.");
            }
        }
        Object.assign(subPhase, update);
        const saved = await this.subPhaseRepository.save(subPhase);
        const phase = await this.phaseRepository.findOne({
            where: { id: subPhase.phase_id },
            relations: ["project", "subPhases"],
        });
        if (phase) {
            const allCompleted = (phase.subPhases || []).every((sp) => sp.isCompleted);
            let PhaseStatus;
            try {
                PhaseStatus = (await Promise.resolve().then(() => require("../entities/phase.entity"))).PhaseStatus;
            }
            catch (e) {
                PhaseStatus = null;
            }
            let newStatus = phase.status;
            if (PhaseStatus) {
                if (allCompleted && phase.status !== PhaseStatus.COMPLETED) {
                    newStatus = PhaseStatus.COMPLETED;
                }
                else if (!allCompleted && phase.status === PhaseStatus.COMPLETED) {
                    newStatus = PhaseStatus.IN_PROGRESS;
                }
                if (newStatus !== phase.status) {
                    phase.status = newStatus;
                    await this.phaseRepository.save(phase);
                }
            }
            const project = await this.projectRepository.findOne({
                where: { id: phase.project_id },
            });
            if (project) {
                await this.activitiesService.createActivity(activity_entity_1.ActivityType.TASK_UPDATED, `SubPhase "${subPhase.title}" was updated (isCompleted: ${subPhase.isCompleted})`, user, project, phase, { subPhaseId: subPhase.id, isCompleted: subPhase.isCompleted });
            }
        }
        return saved;
    }
    async findOne(id) {
        return this.subPhaseRepository.findOne({
            where: { id },
            relations: ["phase", "parentSubPhase", "subPhases"],
        });
    }
    async searchSubPhases(projectId, search) {
        if (!search || search.trim().length === 0) {
            return [];
        }
        const searchTerm = `%${search.trim()}%`;
        const subPhases = await this.subPhaseRepository
            .createQueryBuilder("subPhase")
            .leftJoinAndSelect("subPhase.phase", "phase")
            .leftJoinAndSelect("subPhase.parentSubPhase", "parentSubPhase")
            .leftJoinAndSelect("subPhase.subPhases", "subPhases")
            .leftJoin("phase.project", "project")
            .where("project.id = :projectId", { projectId })
            .andWhere("(subPhase.title ILIKE :search OR subPhase.description ILIKE :search)", { search: searchTerm })
            .getMany();
        const result = await Promise.all(subPhases.map(async (subPhase) => {
            const phase = await this.phaseRepository.findOne({
                where: { id: subPhase.phase_id },
            });
            return {
                subPhase,
                phase: phase || null,
            };
        }));
        return result.filter((item) => item.phase !== null);
    }
    async hasIncompleteNestedSubPhases(subPhaseId) {
        const subPhase = await this.subPhaseRepository
            .createQueryBuilder("subPhase")
            .leftJoinAndSelect("subPhase.subPhases", "nested1")
            .leftJoinAndSelect("nested1.subPhases", "nested2")
            .leftJoinAndSelect("nested2.subPhases", "nested3")
            .where("subPhase.id = :id", { id: subPhaseId })
            .getOne();
        if (!subPhase) {
            return false;
        }
        return this.checkNestedSubPhasesRecursive(subPhase);
    }
    checkNestedSubPhasesRecursive(subPhase) {
        if (!subPhase.subPhases || subPhase.subPhases.length === 0) {
            return false;
        }
        for (const nested of subPhase.subPhases) {
            if (!nested.isCompleted) {
                return true;
            }
            if (this.checkNestedSubPhasesRecursive(nested)) {
                return true;
            }
        }
        return false;
    }
};
exports.SubPhasesService = SubPhasesService;
exports.SubPhasesService = SubPhasesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(sub_phase_entity_1.SubPhase)),
    __param(1, (0, typeorm_1.InjectRepository)(phase_entity_1.Phase)),
    __param(2, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __param(3, (0, common_1.Inject)((0, common_1.forwardRef)(() => activities_service_1.ActivitiesService))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        activities_service_1.ActivitiesService,
        users_service_1.UsersService])
], SubPhasesService);
//# sourceMappingURL=subphases.service.js.map