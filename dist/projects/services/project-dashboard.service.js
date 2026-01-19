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
exports.ProjectDashboardService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const project_entity_1 = require("../../entities/project.entity");
const phase_entity_1 = require("../../entities/phase.entity");
let ProjectDashboardService = class ProjectDashboardService {
    constructor(projectsRepository, phasesRepository) {
        this.projectsRepository = projectsRepository;
        this.phasesRepository = phasesRepository;
    }
    async getDashboardProjectStats() {
        try {
            const result = await this.projectsRepository
                .createQueryBuilder("project")
                .select("COUNT(project.id)", "total")
                .addSelect(`SUM(CASE WHEN project.status IN ('in_progress', 'planning') THEN 1 ELSE 0 END)`, "active")
                .addSelect(`SUM(CASE WHEN project.status = 'completed' THEN 1 ELSE 0 END)`, "completed")
                .addSelect(`SUM(COALESCE(project.total_budget, 0))`, "totalValue")
                .getRawOne();
            return {
                total: parseInt(result?.total) || 0,
                active: parseInt(result?.active) || 0,
                completed: parseInt(result?.completed) || 0,
                totalValue: parseFloat(result?.totalValue) || 0,
            };
        }
        catch (error) {
            return {
                total: 0,
                active: 0,
                completed: 0,
                totalValue: 0,
            };
        }
    }
    async getDashboardPhaseStats() {
        try {
            const result = await this.phasesRepository
                .createQueryBuilder("phase")
                .select("COUNT(phase.id)", "total")
                .addSelect(`SUM(CASE WHEN phase.status = 'completed' THEN 1 ELSE 0 END)`, "completed")
                .addSelect(`SUM(CASE WHEN phase.status = 'in_progress' THEN 1 ELSE 0 END)`, "inProgress")
                .addSelect("SUM(COALESCE(phase.budget, 0))", "totalBudget")
                .getRawOne();
            const total = parseInt(result?.total) || 0;
            const completed = parseInt(result?.completed) || 0;
            const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
            return {
                total,
                completed,
                inProgress: parseInt(result?.inProgress) || 0,
                totalBudget: parseFloat(result?.totalBudget) || 0,
                completionRate,
            };
        }
        catch (error) {
            return {
                total: 0,
                completed: 0,
                inProgress: 0,
                totalBudget: 0,
                completionRate: 0,
            };
        }
    }
    async getDashboardTeamMembersCount() {
        try {
            const result = await this.projectsRepository.query(`
        SELECT COUNT(DISTINCT user_id) as count
        FROM (
          SELECT DISTINCT owner_id::text as user_id
          FROM project
          WHERE owner_id IS NOT NULL
          UNION
          SELECT DISTINCT user_id::text
          FROM project_collaborators
          WHERE user_id IS NOT NULL
        ) AS unique_users
      `);
            return parseInt(result[0]?.count) || 0;
        }
        catch (error) {
            try {
                const ownerCount = await this.projectsRepository
                    .createQueryBuilder("project")
                    .select("COUNT(DISTINCT project.owner_id)", "count")
                    .where("project.owner_id IS NOT NULL")
                    .getRawOne();
                return parseInt(ownerCount?.count) || 0;
            }
            catch {
                return 0;
            }
        }
    }
    async getDashboardMonthlyGrowth() {
        try {
            const now = new Date();
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            const [lastMonthResult, thisMonthResult] = await Promise.all([
                this.projectsRepository
                    .createQueryBuilder("project")
                    .select("COUNT(project.id)", "count")
                    .where("project.created_at >= :lastMonth", { lastMonth })
                    .andWhere("project.created_at < :thisMonth", { thisMonth })
                    .getRawOne(),
                this.projectsRepository
                    .createQueryBuilder("project")
                    .select("COUNT(project.id)", "count")
                    .where("project.created_at >= :thisMonth", { thisMonth })
                    .andWhere("project.created_at < :nextMonth", { nextMonth })
                    .getRawOne(),
            ]);
            const lastMonthProjects = parseInt(lastMonthResult?.count) || 0;
            const thisMonthProjects = parseInt(thisMonthResult?.count) || 0;
            const monthlyGrowth = lastMonthProjects === 0
                ? thisMonthProjects > 0
                    ? 100
                    : 0
                : ((thisMonthProjects - lastMonthProjects) / lastMonthProjects) * 100;
            return Math.round(monthlyGrowth * 100) / 100;
        }
        catch (error) {
            return 0;
        }
    }
};
exports.ProjectDashboardService = ProjectDashboardService;
exports.ProjectDashboardService = ProjectDashboardService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __param(1, (0, typeorm_1.InjectRepository)(phase_entity_1.Phase)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], ProjectDashboardService);
//# sourceMappingURL=project-dashboard.service.js.map