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
const activity_entity_1 = require("../entities/activity.entity");
let SubPhasesService = class SubPhasesService {
    constructor(subPhaseRepository, phaseRepository, projectRepository, activitiesService) {
        this.subPhaseRepository = subPhaseRepository;
        this.phaseRepository = phaseRepository;
        this.projectRepository = projectRepository;
        this.activitiesService = activitiesService;
    }
    async update(id, update, user) {
        const subPhase = await this.subPhaseRepository.findOne({
            where: { id },
            relations: ["phase"],
        });
        if (!subPhase)
            throw new common_1.NotFoundException("SubPhase not found");
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
        activities_service_1.ActivitiesService])
], SubPhasesService);
//# sourceMappingURL=subphases.service.js.map