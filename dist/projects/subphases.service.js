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
const contractor_phase_entity_1 = require("../entities/contractor-phase.entity");
const sub_contractor_phase_entity_1 = require("../entities/sub-contractor-phase.entity");
const project_entity_1 = require("../entities/project.entity");
const user_entity_1 = require("../entities/user.entity");
const activity_entity_1 = require("../entities/activity.entity");
const users_service_1 = require("../users/users.service");
let SubPhasesService = class SubPhasesService {
    constructor(subPhaseRepository, phaseRepository, contractorPhaseRepository, subContractorPhaseRepository, projectRepository, activitiesService, usersService) {
        this.subPhaseRepository = subPhaseRepository;
        this.phaseRepository = phaseRepository;
        this.contractorPhaseRepository = contractorPhaseRepository;
        this.subContractorPhaseRepository = subContractorPhaseRepository;
        this.projectRepository = projectRepository;
        this.activitiesService = activitiesService;
        this.usersService = usersService;
    }
    async create(phaseId, createDto, user) {
        if (!user) {
            throw new common_1.ForbiddenException("User must be authenticated to create sub-phases");
        }
        let phase = null;
        let phaseType = 'legacy';
        let isLinkedSubContractorPhase = false;
        const contractorPhase = await this.contractorPhaseRepository.findOne({
            where: { id: phaseId },
            relations: ["project", "project.owner", "project.collaborators"],
        });
        if (contractorPhase) {
            phase = contractorPhase;
            phaseType = 'contractor';
        }
        else {
            const subContractorPhase = await this.subContractorPhaseRepository.findOne({
                where: { id: phaseId },
                relations: ["project", "project.owner", "project.collaborators", "linkedContractorPhase"],
            });
            if (subContractorPhase) {
                phase = subContractorPhase;
                phaseType = 'sub_contractor';
                if (subContractorPhase.linkedContractorPhaseId) {
                    isLinkedSubContractorPhase = true;
                }
            }
            else {
                const legacyPhase = await this.phaseRepository.findOne({
                    where: { id: phaseId },
                    relations: ["project", "project.owner", "project.collaborators"],
                });
                if (legacyPhase) {
                    phase = legacyPhase;
                    phaseType = 'legacy';
                    if (legacyPhase.boqType === 'sub_contractor' && legacyPhase.linkedContractorPhaseId) {
                        isLinkedSubContractorPhase = true;
                    }
                }
            }
        }
        if (!phase)
            throw new common_1.NotFoundException("Phase not found");
        let parentSubPhase = null;
        if (createDto.parentSubPhaseId) {
            parentSubPhase = await this.subPhaseRepository.findOne({
                where: { id: createDto.parentSubPhaseId },
                relations: ["phase", "subContractorPhase", "subContractorPhase.linkedContractorPhase"],
            });
            if (!parentSubPhase) {
                throw new common_1.NotFoundException("Parent sub-phase not found");
            }
            const parentBelongsToPhase = parentSubPhase.phase_id === phaseId ||
                parentSubPhase.contractorPhaseId === phaseId ||
                parentSubPhase.subContractorPhaseId === phaseId;
            if (!parentBelongsToPhase) {
                throw new common_1.ForbiddenException("Parent sub-phase must belong to the same phase");
            }
            if (parentSubPhase.subContractorPhaseId) {
                if (parentSubPhase.subContractorPhase?.linkedContractorPhaseId) {
                    isLinkedSubContractorPhase = true;
                }
                else {
                    const parentSubContractorPhase = await this.subContractorPhaseRepository.findOne({
                        where: { id: parentSubPhase.subContractorPhaseId },
                        relations: ["linkedContractorPhase"],
                    });
                    if (parentSubContractorPhase?.linkedContractorPhaseId) {
                        isLinkedSubContractorPhase = true;
                    }
                }
            }
        }
        const userWithRole = await this.usersService.findOne(user.id);
        const isSubContractor = userWithRole?.role === user_entity_1.UserRole.SUB_CONTRACTOR;
        const isContractor = userWithRole?.role === user_entity_1.UserRole.CONTRACTOR;
        const isAdmin = userWithRole?.role === user_entity_1.UserRole.CONSULTANT;
        const isConsultant = userWithRole?.role === user_entity_1.UserRole.CONSULTANT;
        const isOwner = phase.project?.owner_id === user.id;
        const isCollaborator = phase.project?.collaborators?.some((c) => c.id === user.id);
        if (isContractor && isLinkedSubContractorPhase && !isAdmin && !isConsultant && !isOwner) {
            throw new common_1.ForbiddenException("Contractors can only view sub-phases from linked sub-contractor phases. Only the sub-contractor can create or modify them.");
        }
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
        const subPhaseData = {
            title: createDto.title,
            description: createDto.description,
            parent_sub_phase_id: createDto.parentSubPhaseId || null,
            isCompleted: createDto.isCompleted || false,
        };
        if (phaseType === 'contractor') {
            subPhaseData.contractorPhaseId = phaseId;
        }
        else if (phaseType === 'sub_contractor') {
            subPhaseData.subContractorPhaseId = phaseId;
        }
        else {
            subPhaseData.phase_id = phaseId;
        }
        const subPhase = this.subPhaseRepository.create(subPhaseData);
        const saved = await this.subPhaseRepository.save(subPhase);
        const savedSubPhase = Array.isArray(saved) ? saved[0] : saved;
        if (phase.project && user) {
            await this.activitiesService.createActivity(activity_entity_1.ActivityType.TASK_CREATED, `Sub-phase "${savedSubPhase.title}" was added to phase "${phase.title || phase.name}"`, user, phase.project, phase, { subPhaseId: savedSubPhase.id });
        }
        return savedSubPhase;
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
                "subPhases",
                "subContractorPhase",
                "subContractorPhase.linkedContractorPhase"
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
        let isLinkedSubContractorPhase = false;
        if (subPhase.subContractorPhaseId) {
            if (subPhase.subContractorPhase?.linkedContractorPhaseId) {
                isLinkedSubContractorPhase = true;
            }
            else {
                const subContractorPhase = await this.subContractorPhaseRepository.findOne({
                    where: { id: subPhase.subContractorPhaseId },
                    relations: ["linkedContractorPhase"],
                });
                if (subContractorPhase?.linkedContractorPhaseId) {
                    isLinkedSubContractorPhase = true;
                }
            }
        }
        if (isContractor && isLinkedSubContractorPhase && !isAdmin && !isConsultant && !isOwner) {
            throw new common_1.ForbiddenException("Contractors can only view sub-phases from linked sub-contractor phases. Only the sub-contractor can modify them.");
        }
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
        let phase = null;
        let project = null;
        let phaseType = 'legacy';
        if (subPhase.contractorPhaseId) {
            phase = await this.contractorPhaseRepository.findOne({
                where: { id: subPhase.contractorPhaseId },
                relations: ["project", "subPhases"],
            });
            phaseType = 'contractor';
        }
        else if (subPhase.subContractorPhaseId) {
            phase = await this.subContractorPhaseRepository.findOne({
                where: { id: subPhase.subContractorPhaseId },
                relations: ["project", "subPhases", "linkedContractorPhase"],
            });
            phaseType = 'sub_contractor';
        }
        else if (subPhase.phase_id) {
            phase = await this.phaseRepository.findOne({
                where: { id: subPhase.phase_id },
                relations: ["project", "subPhases"],
            });
            phaseType = 'legacy';
        }
        if (phase) {
            project = phase.project;
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
                    if (phaseType === 'contractor') {
                        await this.contractorPhaseRepository.save(phase);
                        if (newStatus === PhaseStatus.COMPLETED) {
                            const linkedSubContractorPhases = await this.subContractorPhaseRepository.find({
                                where: {
                                    project_id: phase.project_id,
                                    linkedContractorPhaseId: phase.id,
                                    is_active: true,
                                },
                            });
                            for (const linkedPhase of linkedSubContractorPhases) {
                                if (linkedPhase.status !== PhaseStatus.COMPLETED) {
                                    linkedPhase.status = PhaseStatus.COMPLETED;
                                    await this.subContractorPhaseRepository.save(linkedPhase);
                                }
                            }
                        }
                    }
                    else if (phaseType === 'sub_contractor') {
                        await this.subContractorPhaseRepository.save(phase);
                        if (phase.linkedContractorPhaseId) {
                            const linkedContractorPhase = await this.contractorPhaseRepository.findOne({
                                where: { id: phase.linkedContractorPhaseId, project_id: phase.project_id },
                                relations: ["subPhases"],
                            });
                            if (linkedContractorPhase) {
                                const allLinkedSubContractorPhases = await this.subContractorPhaseRepository.find({
                                    where: {
                                        project_id: phase.project_id,
                                        linkedContractorPhaseId: phase.linkedContractorPhaseId,
                                        is_active: true,
                                    },
                                });
                                const allLinkedCompleted = allLinkedSubContractorPhases.every(p => p.status === PhaseStatus.COMPLETED);
                                if (allLinkedCompleted && linkedContractorPhase.status !== PhaseStatus.COMPLETED) {
                                    linkedContractorPhase.status = PhaseStatus.COMPLETED;
                                    linkedContractorPhase.progress = 100;
                                    await this.contractorPhaseRepository.save(linkedContractorPhase);
                                }
                                else if (!allLinkedCompleted && linkedContractorPhase.status === PhaseStatus.COMPLETED) {
                                    linkedContractorPhase.status = PhaseStatus.IN_PROGRESS;
                                    const completedCount = allLinkedSubContractorPhases.filter(p => p.status === PhaseStatus.COMPLETED).length;
                                    linkedContractorPhase.progress = Math.min(100, (completedCount / allLinkedSubContractorPhases.length) * 100);
                                    await this.contractorPhaseRepository.save(linkedContractorPhase);
                                }
                            }
                        }
                    }
                    else {
                        await this.phaseRepository.save(phase);
                    }
                }
            }
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
    __param(2, (0, typeorm_1.InjectRepository)(contractor_phase_entity_1.ContractorPhase)),
    __param(3, (0, typeorm_1.InjectRepository)(sub_contractor_phase_entity_1.SubContractorPhase)),
    __param(4, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __param(5, (0, common_1.Inject)((0, common_1.forwardRef)(() => activities_service_1.ActivitiesService))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        activities_service_1.ActivitiesService,
        users_service_1.UsersService])
], SubPhasesService);
//# sourceMappingURL=subphases.service.js.map