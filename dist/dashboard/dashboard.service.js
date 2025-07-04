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
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const project_entity_1 = require("../entities/project.entity");
const user_entity_1 = require("../entities/user.entity");
const task_entity_1 = require("../entities/task.entity");
let DashboardService = class DashboardService {
    constructor(projectsRepository, usersRepository, tasksRepository) {
        this.projectsRepository = projectsRepository;
        this.usersRepository = usersRepository;
        this.tasksRepository = tasksRepository;
    }
    async getStats(userId) {
        const [totalProjects, activeProjects, completedProjects, totalTeamMembers, phaseStats, monthlyGrowth, totalProjectValues, taskStats, phasePriorityBreakdown, averagePhaseProgress,] = await Promise.all([
            this.getTotalProjects(userId),
            this.getActiveProjects(userId),
            this.getCompletedProjects(userId),
            this.getTotalTeamMembers(userId),
            this.getPhaseStats(userId),
            this.getMonthlyGrowth(userId),
            this.getTotalProjectValues(userId),
            this.getTaskStats(userId),
            this.getPhasePriorityBreakdown(userId),
            this.getAveragePhaseProgress(userId),
        ]);
        return {
            totalProjects: totalProjects,
            activeProjects: activeProjects,
            completedProjects: completedProjects,
            totalValue: totalProjectValues,
            monthlyGrowth: monthlyGrowth,
            teamMembers: totalTeamMembers,
            phaseStats: {
                totalPhases: phaseStats.total_phases,
                completedPhases: phaseStats.completed_phases,
                inProgressPhases: phaseStats.in_progress_phases,
                totalBudget: phaseStats.total_budget,
            },
            completion_rate: totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0,
            total_tasks: taskStats.total_tasks,
            tasks_per_phase: taskStats.tasks_per_phase,
            average_phase_progress: averagePhaseProgress,
            phase_priority_breakdown: phasePriorityBreakdown,
        };
    }
    async getTotalProjects(userId) {
        return this.projectsRepository.count({
            where: [{ owner_id: userId }, { collaborators: { id: userId } }],
        });
    }
    async getActiveProjects(userId) {
        return this.projectsRepository.count({
            where: [
                { owner_id: userId, status: project_entity_1.ProjectStatus.IN_PROGRESS },
                { collaborators: { id: userId }, status: project_entity_1.ProjectStatus.IN_PROGRESS },
            ],
        });
    }
    async getCompletedProjects(userId) {
        return this.projectsRepository.count({
            where: [
                { owner_id: userId, status: project_entity_1.ProjectStatus.COMPLETED },
                { collaborators: { id: userId }, status: project_entity_1.ProjectStatus.COMPLETED },
            ],
        });
    }
    async getTotalTeamMembers(userId) {
        const projects = await this.projectsRepository.find({
            where: [{ owner_id: userId }, { collaborators: { id: userId } }],
            relations: ["collaborators"],
        });
        const uniqueTeamMembers = new Set();
        projects.forEach((project) => {
            project.collaborators.forEach((collaborator) => {
                uniqueTeamMembers.add(collaborator.id);
            });
            if (project.owner_id) {
                uniqueTeamMembers.add(project.owner_id);
            }
        });
        return uniqueTeamMembers.size;
    }
    async getPhaseStats(userId) {
        const projects = await this.projectsRepository.find({
            where: [{ owner_id: userId }, { collaborators: { id: userId } }],
            relations: ["phases"],
        });
        const stats = {
            total_phases: 0,
            completed_phases: 0,
            in_progress_phases: 0,
            total_budget: 0,
        };
        projects.forEach((project) => {
            const projectPhases = project.phases || [];
            stats.total_phases += projectPhases.length;
            stats.completed_phases += projectPhases.filter((phase) => phase.status === "completed").length;
            stats.in_progress_phases += projectPhases.filter((phase) => phase.status === "in_progress").length;
            stats.total_budget += projectPhases.reduce((sum, phase) => sum + (phase.budget || 0), 0);
        });
        return stats;
    }
    async getMonthlyGrowth(userId) {
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const [lastMonthProjects, thisMonthProjects] = await Promise.all([
            this.projectsRepository.count({
                where: [
                    {
                        owner_id: userId,
                        created_at: (0, typeorm_2.Between)(lastMonth, thisMonth),
                    },
                    {
                        collaborators: { id: userId },
                        created_at: (0, typeorm_2.Between)(lastMonth, thisMonth),
                    },
                ],
            }),
            this.projectsRepository.count({
                where: [
                    {
                        owner_id: userId,
                        created_at: (0, typeorm_2.Between)(thisMonth, now),
                    },
                    {
                        collaborators: { id: userId },
                        created_at: (0, typeorm_2.Between)(thisMonth, now),
                    },
                ],
            }),
        ]);
        if (lastMonthProjects === 0)
            return 100;
        return ((thisMonthProjects - lastMonthProjects) / lastMonthProjects) * 100;
    }
    async getTotalProjectValues(userId) {
        const projects = await this.projectsRepository.find({
            where: [{ owner_id: userId }, { collaborators: { id: userId } }],
            select: ["total_amount"],
        });
        return projects.reduce((sum, project) => sum + (project.total_amount || 0), 0);
    }
    async getProjectProgress(project) {
        const projectPhases = project.phases || [];
        const totalPhases = projectPhases.length;
        const completedPhases = projectPhases.filter((phase) => phase.status === "completed").length;
        return {
            totalPhases,
            completedPhases,
            progress: totalPhases > 0 ? (completedPhases / totalPhases) * 100 : 0,
        };
    }
    async getProjectBudget(project) {
        const projectPhases = project.phases || [];
        const totalBudget = projectPhases.reduce((sum, phase) => sum + phase.budget, 0);
        return {
            totalBudget,
            spent: 0,
            remaining: totalBudget,
        };
    }
    async getTaskStats(userId) {
        const projects = await this.projectsRepository.find({
            where: [{ owner_id: userId }, { collaborators: { id: userId } }],
            relations: ["phases", "phases.tasks"],
        });
        let totalTasks = 0;
        let totalPhases = 0;
        projects.forEach((project) => {
            (project.phases || []).forEach((phase) => {
                totalPhases++;
                const tasks = phase.tasks || [];
                totalTasks += tasks.length;
            });
        });
        return {
            total_tasks: totalTasks,
            tasks_per_phase: totalPhases > 0 ? totalTasks / totalPhases : 0,
        };
    }
    async getPhasePriorityBreakdown(userId) {
        const projects = await this.projectsRepository.find({
            where: [{ owner_id: userId }, { collaborators: { id: userId } }],
            relations: ["phases"],
        });
        const breakdown = { low: 0, medium: 0, high: 0, urgent: 0, none: 0 };
        projects.forEach((project) => {
            (project.phases || []).forEach((phase) => {
                const p = (phase.priority || "none").toLowerCase();
                if (breakdown[p] !== undefined)
                    breakdown[p]++;
                else
                    breakdown.none++;
            });
        });
        return breakdown;
    }
    async getAveragePhaseProgress(userId) {
        const projects = await this.projectsRepository.find({
            where: [{ owner_id: userId }, { collaborators: { id: userId } }],
            relations: ["phases"],
        });
        let totalProgress = 0;
        let count = 0;
        projects.forEach((project) => {
            (project.phases || []).forEach((phase) => {
                if (typeof phase.progress === "number") {
                    totalProgress += phase.progress;
                    count++;
                }
            });
        });
        return count > 0 ? totalProgress / count : 0;
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(2, (0, typeorm_1.InjectRepository)(task_entity_1.Task)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map