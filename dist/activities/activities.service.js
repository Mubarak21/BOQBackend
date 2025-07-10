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
exports.ActivitiesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const activity_entity_1 = require("../entities/activity.entity");
const projects_service_1 = require("../projects/projects.service");
let ActivitiesService = class ActivitiesService {
    constructor(activitiesRepository, projectsService) {
        this.activitiesRepository = activitiesRepository;
        this.projectsService = projectsService;
    }
    async createActivity(type, description, user, project, phaseOrTask, metadata = {}) {
        const activity = this.activitiesRepository.create({
            type,
            description,
            user_id: user.id,
            project_id: project.id,
            metadata: JSON.stringify(metadata),
        });
        return this.activitiesRepository.save(activity);
    }
    async getProjectActivities(projectId, limit = 10, offset = 0) {
        return this.activitiesRepository.find({
            where: { project_id: projectId },
            relations: ["user", "task"],
            order: { created_at: "DESC" },
            take: limit,
            skip: offset,
        });
    }
    async getUserActivities(userId, limit = 10, offset = 0) {
        return this.activitiesRepository.find({
            where: { user_id: userId },
            relations: ["project", "task"],
            order: { created_at: "DESC" },
            take: limit,
            skip: offset,
        });
    }
    async getRecentActivities(limit = 10, offset = 0) {
        return this.activitiesRepository.find({
            relations: ["user", "project", "task"],
            order: { created_at: "DESC" },
            take: limit,
            skip: offset,
        });
    }
    async countAll() {
        return this.activitiesRepository.count();
    }
    async logBoqUploaded(user, project, filename, totalPhases, totalAmount) {
        return this.createActivity(activity_entity_1.ActivityType.BOQ_UPLOADED, `BOQ file "${filename}" was uploaded with ${totalPhases} phases`, user, project, null, {
            filename,
            total_phases: totalPhases,
            total_amount: totalAmount,
        });
    }
    async logPhaseCreated(user, project, phase, phaseNumber, totalPhases) {
        return this.createActivity(activity_entity_1.ActivityType.TASK_CREATED, `Phase ${phaseNumber}/${totalPhases}: "${phase.title}" was created`, user, project, phase, {
            phase_id: phase.id,
            phase_number: phaseNumber,
            total_phases: totalPhases,
            budget: phase.budget,
        });
    }
    async logPhaseCompleted(user, project, phase, phaseNumber, totalPhases) {
        return this.createActivity(activity_entity_1.ActivityType.PHASE_COMPLETED, `Phase ${phaseNumber}/${totalPhases}: "${phase.title}" was completed`, user, project, phase, {
            phase_id: phase.id,
            phase_number: phaseNumber,
            total_phases: totalPhases,
        });
    }
    async logPhaseProgress(user, project, phase, phaseNumber, totalPhases, progress) {
        return this.createActivity(activity_entity_1.ActivityType.TASK_UPDATED, `Phase ${phaseNumber}/${totalPhases}: "${phase.title}" progress updated to ${progress}%`, user, project, phase, {
            phase_id: phase.id,
            phase_number: phaseNumber,
            total_phases: totalPhases,
            progress,
            previous_progress: phase.progress,
        });
    }
    async logPhaseDelay(user, project, phase, phaseNumber, totalPhases, delayDays) {
        return this.createActivity(activity_entity_1.ActivityType.TASK_UPDATED, `Phase ${phaseNumber}/${totalPhases}: "${phase.title}" is ${delayDays} days behind schedule`, user, project, phase, {
            phase_id: phase.id,
            phase_number: phaseNumber,
            total_phases: totalPhases,
            delay_days: delayDays,
            end_date: phase.end_date,
        });
    }
    async logPhaseBudgetUpdate(user, project, phase, phaseNumber, totalPhases, oldBudget, newBudget) {
        return this.createActivity(activity_entity_1.ActivityType.TASK_UPDATED, `Phase ${phaseNumber}/${totalPhases}: "${phase.title}" budget updated from ${oldBudget} to ${newBudget}`, user, project, phase, {
            phase_id: phase.id,
            phase_number: phaseNumber,
            total_phases: totalPhases,
            old_budget: oldBudget,
            new_budget: newBudget,
        });
    }
    async logPhaseDeleted(user, project, phase, phaseNumber, totalPhases) {
        return this.createActivity(activity_entity_1.ActivityType.TASK_DELETED, `Phase ${phaseNumber}/${totalPhases}: "${phase.title}" was deleted`, user, project, phase, {
            phase_id: phase.id,
            phase_number: phaseNumber,
            total_phases: totalPhases,
            budget: phase.budget,
        });
    }
    async logProjectCreated(user, project, task) {
        return this.createActivity(activity_entity_1.ActivityType.PROJECT_CREATED, `Project "${project.title}" was created`, user, project, task);
    }
    async logTaskCompleted(user, project, task) {
        return this.createActivity(activity_entity_1.ActivityType.TASK_COMPLETED, `Task "${task.description}" was completed`, user, project, task);
    }
    async logCommentAdded(user, project, task) {
        return this.createActivity(activity_entity_1.ActivityType.COMMENT_ADDED, `Comment added on "${task.description}"`, user, project, task);
    }
    async logCollaboratorAdded(user, project, collaborator) {
        return this.createActivity(activity_entity_1.ActivityType.COLLABORATOR_ADDED, `${collaborator.display_name} joined as a collaborator in ${project.title}`, user, project, null, { collaborator_id: collaborator.id });
    }
    async getPhaseActivities(phaseId, limit = 10, offset = 0) {
        return this.activitiesRepository
            .createQueryBuilder("activity")
            .where(`activity.metadata::jsonb ->> 'phase_id' = :phaseId`, { phaseId })
            .orderBy("activity.created_at", "DESC")
            .take(limit)
            .skip(offset)
            .getMany();
    }
    async logJoinRequest(owner, project, requester) {
        return this.createActivity(activity_entity_1.ActivityType.COLLABORATOR_ADDED, `${requester.display_name} requested to join your project`, owner, project, null, { requester_id: requester.id });
    }
    async getUserProjectActivities(userId, limit = 10, offset = 0) {
        const projects = await this.projectsService.findAll();
        const userProjectIds = projects
            .filter((p) => p.owner_id === userId ||
            (p.collaborators && p.collaborators.some((c) => c.id === userId)))
            .map((p) => p.id);
        if (userProjectIds.length === 0)
            return [];
        return this.activitiesRepository.find({
            where: { project_id: (0, typeorm_2.In)(userProjectIds) },
            relations: ["user", "project", "task"],
            order: { created_at: "DESC" },
            take: limit,
            skip: offset,
        });
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
        const qb = this.activitiesRepository
            .createQueryBuilder("activity")
            .select(`to_char(activity.created_at, '${groupFormat}')`, "period")
            .addSelect("COUNT(*)", "count");
        if (startDate)
            qb.andWhere("activity.created_at >= :startDate", { startDate });
        if (endDate)
            qb.andWhere("activity.created_at <= :endDate", { endDate });
        qb.groupBy("period").orderBy("period", "ASC");
        return qb.getRawMany();
    }
    async adminList({ userId, type, dateFrom, dateTo, projectId, search = "", page = 1, limit = 20, }) {
        const qb = this.activitiesRepository
            .createQueryBuilder("activity")
            .leftJoinAndSelect("activity.user", "user")
            .leftJoinAndSelect("activity.project", "project");
        if (userId) {
            qb.andWhere("activity.user_id = :userId", { userId });
        }
        if (type) {
            qb.andWhere("activity.type = :type", { type });
        }
        if (dateFrom) {
            qb.andWhere("activity.created_at >= :dateFrom", { dateFrom });
        }
        if (dateTo) {
            qb.andWhere("activity.created_at <= :dateTo", { dateTo });
        }
        if (projectId) {
            qb.andWhere("activity.project_id = :projectId", { projectId });
        }
        if (search) {
            qb.andWhere("activity.description ILIKE :search", {
                search: `%${search}%`,
            });
        }
        qb.orderBy("activity.created_at", "DESC")
            .skip((page - 1) * limit)
            .take(limit);
        const [items, total] = await qb.getManyAndCount();
        return {
            items: items.map((a) => ({
                id: a.id,
                type: a.type,
                description: a.description,
                user: a.user
                    ? { id: a.user.id, name: a.user.display_name, email: a.user.email }
                    : null,
                project: a.project ? { id: a.project.id, name: a.project.title } : null,
                timestamp: a.created_at,
            })),
            total,
            page,
            limit,
        };
    }
    async adminGetDetails(id) {
        const activity = await this.activitiesRepository.findOne({
            where: { id },
            relations: ["user", "project"],
        });
        if (!activity)
            throw new Error("Activity not found");
        return {
            id: activity.id,
            type: activity.type,
            description: activity.description,
            user: activity.user
                ? {
                    id: activity.user.id,
                    name: activity.user.display_name,
                    email: activity.user.email,
                }
                : null,
            project: activity.project
                ? { id: activity.project.id, name: activity.project.title }
                : null,
            timestamp: activity.created_at,
        };
    }
};
exports.ActivitiesService = ActivitiesService;
exports.ActivitiesService = ActivitiesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(activity_entity_1.Activity)),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => projects_service_1.ProjectsService))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        projects_service_1.ProjectsService])
], ActivitiesService);
//# sourceMappingURL=activities.service.js.map