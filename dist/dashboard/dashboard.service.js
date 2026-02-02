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
const phase_entity_1 = require("../entities/phase.entity");
const stats_entity_1 = require("../entities/stats.entity");
const comment_entity_1 = require("../entities/comment.entity");
const penalty_entity_1 = require("../entities/penalty.entity");
const complaint_entity_1 = require("../entities/complaint.entity");
const accident_entity_1 = require("../entities/accident.entity");
const daily_attendance_entity_1 = require("../entities/daily-attendance.entity");
const phase_evidence_entity_1 = require("../entities/phase-evidence.entity");
const projects_service_1 = require("../projects/projects.service");
let DashboardService = class DashboardService {
    constructor(projectsRepository, usersRepository, tasksRepository, statsRepository, commentsRepository, penaltiesRepository, complaintsRepository, accidentsRepository, dailyAttendanceRepository, phaseEvidenceRepository, projectsService) {
        this.projectsRepository = projectsRepository;
        this.usersRepository = usersRepository;
        this.tasksRepository = tasksRepository;
        this.statsRepository = statsRepository;
        this.commentsRepository = commentsRepository;
        this.penaltiesRepository = penaltiesRepository;
        this.complaintsRepository = complaintsRepository;
        this.accidentsRepository = accidentsRepository;
        this.dailyAttendanceRepository = dailyAttendanceRepository;
        this.phaseEvidenceRepository = phaseEvidenceRepository;
        this.projectsService = projectsService;
    }
    async getStats(userId, userRole) {
        const isConsultant = userRole?.toLowerCase() === user_entity_1.UserRole.CONSULTANT.toLowerCase();
        const isContractor = userRole?.toLowerCase() === user_entity_1.UserRole.CONTRACTOR.toLowerCase();
        const isSubContractor = userRole?.toLowerCase() === user_entity_1.UserRole.SUB_CONTRACTOR.toLowerCase();
        const canSeeAllProjects = isConsultant;
        const [totalProjects, activeProjects, completedProjects, totalTeamMembers, phaseStats, monthlyGrowth, totalProjectValues, taskStats, averagePhaseProgress,] = await Promise.all([
            this.getTotalProjects(userId, canSeeAllProjects),
            this.getActiveProjects(userId, canSeeAllProjects),
            this.getCompletedProjects(userId, canSeeAllProjects),
            this.getTotalTeamMembers(userId, canSeeAllProjects),
            this.getPhaseStats(userId, canSeeAllProjects),
            this.getMonthlyGrowth(userId, canSeeAllProjects),
            this.getTotalProjectValues(userId, canSeeAllProjects),
            this.getTaskStats(userId, canSeeAllProjects),
            this.getAveragePhaseProgress(userId, canSeeAllProjects),
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
                completionRate: phaseStats.completion_rate || 0,
            },
            completion_rate: totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0,
            total_tasks: taskStats.total_tasks,
            tasks_per_phase: taskStats.tasks_per_phase,
            average_phase_progress: averagePhaseProgress,
        };
    }
    async updateStats() {
        const allProjects = await this.projectsRepository.find();
        const totalProjects = allProjects.length;
        const projects = await this.projectsRepository.find({
            relations: ["collaborators", "owner", "phases"],
        });
        const totalValue = projects
            .reduce((sum, project) => sum + Number(project.totalBudget ?? project.totalAmount ?? 0), 0)
            .toFixed(2);
        const uniqueTeamMembers = new Set();
        projects.forEach((project) => {
            project.collaborators?.forEach((collaborator) => uniqueTeamMembers.add(collaborator.id));
            if (project.owner_id)
                uniqueTeamMembers.add(project.owner_id);
        });
        const teamMembers = uniqueTeamMembers.size;
        let stats = await this.statsRepository.findOneBy({});
        if (!stats) {
            stats = this.statsRepository.create();
        }
        else {
        }
        stats.total_projects = totalProjects;
        stats.total_value = totalValue;
        stats.team_members = teamMembers;
        await this.statsRepository.save(stats);
        return stats;
    }
    async getStatsFromTable() {
        let stats = await this.statsRepository.findOneBy({});
        if (!stats) {
            return {
                total_projects: 0,
                total_value: "0.00",
                team_members: 0,
                updated_at: null,
            };
        }
        return stats;
    }
    async getUserStatsForDashboard(userId, userRole) {
        const isConsultant = userRole?.toLowerCase() === user_entity_1.UserRole.CONSULTANT.toLowerCase();
        const isContractor = userRole?.toLowerCase() === user_entity_1.UserRole.CONTRACTOR.toLowerCase();
        const isSubContractor = userRole?.toLowerCase() === user_entity_1.UserRole.SUB_CONTRACTOR.toLowerCase();
        const canSeeAllProjects = isConsultant;
        const [totalProjects, completedProjects, totalTeamMembers, totalValue] = await Promise.all([
            this.getTotalProjects(userId, canSeeAllProjects),
            this.getCompletedProjects(userId, canSeeAllProjects),
            this.getTotalTeamMembers(userId, canSeeAllProjects),
            this.getTotalProjectValues(userId, canSeeAllProjects),
        ]);
        const completion_rate = totalProjects > 0
            ? ((completedProjects / totalProjects) * 100).toFixed(2)
            : "0.00";
        return {
            total_projects: totalProjects,
            team_members: totalTeamMembers,
            completion_rate: completion_rate,
            updated_at: new Date().toISOString(),
        };
    }
    async getTotalProjects(userId, canSeeAllProjects = false) {
        if (canSeeAllProjects) {
            const count = await this.projectsRepository.count();
            return count;
        }
        const count = await this.projectsRepository.count({
            where: [{ owner_id: userId }, { collaborators: { id: userId } }],
        });
        return count;
    }
    async getActiveProjects(userId, canSeeAllProjects = false) {
        if (canSeeAllProjects) {
            return this.projectsRepository.count({
                where: { status: project_entity_1.ProjectStatus.IN_PROGRESS },
            });
        }
        return this.projectsRepository.count({
            where: [
                { owner_id: userId, status: project_entity_1.ProjectStatus.IN_PROGRESS },
                { collaborators: { id: userId }, status: project_entity_1.ProjectStatus.IN_PROGRESS },
            ],
        });
    }
    async getCompletedProjects(userId, canSeeAllProjects = false) {
        if (canSeeAllProjects) {
            return this.projectsRepository.count({
                where: { status: project_entity_1.ProjectStatus.COMPLETED },
            });
        }
        return this.projectsRepository.count({
            where: [
                { owner_id: userId, status: project_entity_1.ProjectStatus.COMPLETED },
                { collaborators: { id: userId }, status: project_entity_1.ProjectStatus.COMPLETED },
            ],
        });
    }
    async getTotalTeamMembers(userId, canSeeAllProjects = false) {
        const projects = canSeeAllProjects
            ? await this.projectsRepository.find({
                relations: ["collaborators"],
            })
            : await this.projectsRepository.find({
                where: [{ owner_id: userId }, { collaborators: { id: userId } }],
                relations: ["collaborators"],
            });
        const uniqueTeamMembers = new Set();
        projects.forEach((project) => {
            project.collaborators?.forEach((collaborator) => {
                uniqueTeamMembers.add(collaborator.id);
            });
            if (project.owner_id) {
                uniqueTeamMembers.add(project.owner_id);
            }
        });
        return uniqueTeamMembers.size;
    }
    async getPhaseStats(userId, canSeeAllProjects = false) {
        const projects = canSeeAllProjects
            ? await this.projectsRepository.find({
                relations: ["phases"],
            })
            : await this.projectsRepository.find({
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
            const projectPhases = (project.phases || []).filter((phase) => phase.is_active !== false);
            stats.total_phases += projectPhases.length;
            stats.completed_phases += projectPhases.filter((phase) => phase.status === phase_entity_1.PhaseStatus.COMPLETED).length;
            stats.in_progress_phases += projectPhases.filter((phase) => phase.status === phase_entity_1.PhaseStatus.IN_PROGRESS).length;
            stats.total_budget += projectPhases.reduce((sum, phase) => sum + (Number(phase.budget) || 0), 0);
        });
        const completionRate = stats.total_phases > 0
            ? Math.round((stats.completed_phases / stats.total_phases) * 100)
            : 0;
        return {
            ...stats,
            completion_rate: completionRate,
        };
    }
    async getMonthlyGrowth(userId, canSeeAllProjects = false) {
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const whereCondition = canSeeAllProjects
            ? { created_at: (0, typeorm_2.Between)(lastMonth, thisMonth) }
            : [
                {
                    owner_id: userId,
                    created_at: (0, typeorm_2.Between)(lastMonth, thisMonth),
                },
                {
                    collaborators: { id: userId },
                    created_at: (0, typeorm_2.Between)(lastMonth, thisMonth),
                },
            ];
        const whereConditionThisMonth = canSeeAllProjects
            ? { created_at: (0, typeorm_2.Between)(thisMonth, now) }
            : [
                {
                    owner_id: userId,
                    created_at: (0, typeorm_2.Between)(thisMonth, now),
                },
                {
                    collaborators: { id: userId },
                    created_at: (0, typeorm_2.Between)(thisMonth, now),
                },
            ];
        const [lastMonthProjects, thisMonthProjects] = await Promise.all([
            this.projectsRepository.count({
                where: whereCondition,
            }),
            this.projectsRepository.count({
                where: whereConditionThisMonth,
            }),
        ]);
        if (lastMonthProjects === 0)
            return 100;
        return ((thisMonthProjects - lastMonthProjects) / lastMonthProjects) * 100;
    }
    async getTotalProjectValues(userId, canSeeAllProjects = false) {
        const projects = canSeeAllProjects
            ? await this.projectsRepository.find({
                select: ["totalAmount"],
                relations: ["financialSummary"],
            })
            : await this.projectsRepository.find({
                where: [{ owner_id: userId }, { collaborators: { id: userId } }],
                select: ["totalAmount"],
                relations: ["financialSummary"],
            });
        return projects.reduce((sum, project) => {
            const budget = project.financialSummary?.totalBudget != null ? Number(project.financialSummary.totalBudget) : null;
            const amount = project.totalAmount != null ? Number(project.totalAmount) : null;
            const value = (budget != null && !isNaN(budget)) ? budget :
                (amount != null && !isNaN(amount)) ? amount : 0;
            return sum + value;
        }, 0);
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
    async getTaskStats(userId, canSeeAllProjects = false) {
        const projects = canSeeAllProjects
            ? await this.projectsRepository.find({
                relations: ["phases", "phases.tasks"],
            })
            : await this.projectsRepository.find({
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
    async getAveragePhaseProgress(userId, canSeeAllProjects = false) {
        const projects = canSeeAllProjects
            ? await this.projectsRepository.find({
                relations: ["phases"],
            })
            : await this.projectsRepository.find({
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
    async getNotifications(userId, limit = 20, userRole) {
        const userProjects = await this.projectsService.findUserProjects(userId);
        const projectIds = userProjects.map((p) => p.id);
        if (projectIds.length === 0)
            return [];
        const projectMap = new Map(userProjects.map((p) => [p.id, p.title]));
        const consultantRole = user_entity_1.UserRole.CONSULTANT.toLowerCase();
        const contractorRole = user_entity_1.UserRole.CONTRACTOR.toLowerCase();
        const subContractorRole = user_entity_1.UserRole.SUB_CONTRACTOR.toLowerCase();
        const isConsultant = userRole?.toLowerCase() === consultantRole;
        const items = [];
        const [comments, penalties] = await Promise.all([
            this.commentsRepository.find({
                where: { project_id: (0, typeorm_2.In)(projectIds) },
                relations: ["author", "project"],
                order: { created_at: "DESC" },
                take: limit,
            }),
            this.penaltiesRepository.find({
                where: { project_id: (0, typeorm_2.In)(projectIds) },
                relations: ["project"],
                order: { created_at: "DESC" },
                take: limit,
            }),
        ]);
        for (const c of comments) {
            const authorRole = c.author?.role?.toLowerCase();
            if (authorRole === consultantRole) {
                const projectName = c.project?.title ?? projectMap.get(c.project_id) ?? "Project";
                items.push({
                    id: `feedback-${c.id}`,
                    type: "feedback",
                    title: "Consultant feedback",
                    message: c.content.length > 80 ? c.content.slice(0, 80) + "…" : c.content,
                    projectId: c.project_id,
                    projectName,
                    createdAt: c.created_at.toISOString(),
                });
            }
        }
        for (const p of penalties) {
            const projectName = p.project?.title ?? projectMap.get(p.project_id) ?? "Project";
            items.push({
                id: `penalty-${p.id}`,
                type: "penalty",
                title: "Penalty assigned",
                message: p.reason.length > 80 ? p.reason.slice(0, 80) + "…" : p.reason,
                projectId: p.project_id,
                projectName,
                createdAt: p.created_at.toISOString(),
            });
        }
        if (isConsultant && projectIds.length > 0) {
            const [complaints, accidents, attendances, evidences] = await Promise.all([
                this.complaintsRepository.find({
                    where: { project_id: (0, typeorm_2.In)(projectIds) },
                    relations: ["raiser", "project"],
                    order: { created_at: "DESC" },
                    take: limit,
                }),
                this.accidentsRepository.find({
                    where: { project_id: (0, typeorm_2.In)(projectIds) },
                    relations: ["reportedByUser", "project"],
                    order: { created_at: "DESC" },
                    take: limit,
                }),
                this.dailyAttendanceRepository.find({
                    where: { project_id: (0, typeorm_2.In)(projectIds) },
                    relations: ["recordedByUser", "project"],
                    order: { created_at: "DESC" },
                    take: limit,
                }),
                this.phaseEvidenceRepository
                    .createQueryBuilder("ev")
                    .innerJoinAndSelect("ev.phase", "phase")
                    .innerJoinAndSelect("ev.uploader", "uploader")
                    .where("phase.project_id IN (:...projectIds)", { projectIds })
                    .orderBy("ev.created_at", "DESC")
                    .take(limit)
                    .getMany(),
            ]);
            for (const c of complaints) {
                const raiserRole = c.raiser?.role?.toLowerCase();
                if (raiserRole === contractorRole || raiserRole === subContractorRole) {
                    const projectName = c.project?.title ?? projectMap.get(c.project_id) ?? "Project";
                    items.push({
                        id: `complaint-${c.id}`,
                        type: "complaint",
                        title: "New complaint",
                        message: (() => {
                            const raw = c.title || c.description || "Complaint raised";
                            return raw.slice(0, 80) + (raw.length > 80 ? "…" : "");
                        })(),
                        projectId: c.project_id,
                        projectName,
                        createdAt: c.created_at.toISOString(),
                    });
                }
            }
            for (const a of accidents) {
                const reporterRole = a.reportedByUser?.role?.toLowerCase();
                if (reporterRole === contractorRole || reporterRole === subContractorRole) {
                    const projectName = a.project?.title ?? projectMap.get(a.project_id) ?? "Project";
                    items.push({
                        id: `accident-${a.id}`,
                        type: "accident",
                        title: "Site accident reported",
                        message: a.description?.slice(0, 80) + (a.description && a.description.length > 80 ? "…" : "") || "Accident on site",
                        projectId: a.project_id,
                        projectName,
                        createdAt: a.created_at.toISOString(),
                    });
                }
            }
            for (const att of attendances) {
                const recorderRole = att.recordedByUser?.role?.toLowerCase();
                if (recorderRole === contractorRole || recorderRole === subContractorRole) {
                    const projectName = projectMap.get(att.project_id) ?? "Project";
                    items.push({
                        id: `attendance-${att.id}`,
                        type: "attendance",
                        title: "Daily attendance recorded",
                        message: `${att.workers_present} workers on ${att.attendance_date}`,
                        projectId: att.project_id,
                        projectName,
                        createdAt: att.created_at.toISOString(),
                    });
                }
            }
            for (const ev of evidences) {
                const uploaderRole = ev.uploader?.role?.toLowerCase();
                if (uploaderRole === contractorRole || uploaderRole === subContractorRole) {
                    const phase = ev.phase;
                    const projectId = phase?.project_id;
                    if (!projectId || !projectIds.includes(projectId))
                        continue;
                    const projectName = projectMap.get(projectId) ?? "Project";
                    items.push({
                        id: `evidence-${ev.id}`,
                        type: "evidence",
                        title: "Evidence uploaded",
                        message: (ev.notes || `${ev.type} evidence`).slice(0, 80),
                        projectId,
                        projectName,
                        createdAt: ev.created_at.toISOString(),
                    });
                }
            }
        }
        items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return items.slice(0, limit);
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(2, (0, typeorm_1.InjectRepository)(task_entity_1.Task)),
    __param(3, (0, typeorm_1.InjectRepository)(stats_entity_1.Stats)),
    __param(4, (0, typeorm_1.InjectRepository)(comment_entity_1.Comment)),
    __param(5, (0, typeorm_1.InjectRepository)(penalty_entity_1.Penalty)),
    __param(6, (0, typeorm_1.InjectRepository)(complaint_entity_1.Complaint)),
    __param(7, (0, typeorm_1.InjectRepository)(accident_entity_1.Accident)),
    __param(8, (0, typeorm_1.InjectRepository)(daily_attendance_entity_1.DailyAttendance)),
    __param(9, (0, typeorm_1.InjectRepository)(phase_evidence_entity_1.PhaseEvidence)),
    __param(10, (0, common_1.Inject)((0, common_1.forwardRef)(() => projects_service_1.ProjectsService))),
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
        projects_service_1.ProjectsService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map