"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateStatsFromProjects = calculateStatsFromProjects;
const project_entity_1 = require("../entities/project.entity");
function calculateStatsFromProjects(projects) {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const uniqueTeamMembers = new Set();
    projects.forEach((project) => {
        project.collaborators?.forEach((collaborator) => {
            uniqueTeamMembers.add(collaborator.id);
        });
        if (project.owner_id) {
            uniqueTeamMembers.add(project.owner_id);
        }
    });
    const phaseStats = {
        total_phases: 0,
        completed_phases: 0,
        in_progress_phases: 0,
        total_budget: 0,
        spent_budget: 0,
    };
    projects.forEach((project) => {
        const projectPhases = project.phases || [];
        phaseStats.total_phases += projectPhases.length;
        phaseStats.completed_phases += projectPhases.filter((phase) => phase.status === "completed").length;
        phaseStats.in_progress_phases += projectPhases.filter((phase) => phase.status === "in_progress").length;
        phaseStats.total_budget += projectPhases.reduce((sum, phase) => sum + (phase.budget || 0), 0);
        phaseStats.spent_budget += projectPhases.reduce((sum, phase) => sum + (phase.spent || 0), 0);
    });
    const lastMonthProjects = projects.filter((project) => project.created_at >= lastMonth && project.created_at < thisMonth).length;
    const thisMonthProjects = projects.filter((project) => project.created_at >= thisMonth && project.created_at <= now).length;
    const monthlyGrowth = lastMonthProjects === 0
        ? 100
        : ((thisMonthProjects - lastMonthProjects) / lastMonthProjects) * 100;
    const totalProjects = projects.length;
    const activeProjects = projects.filter((project) => project.status !== project_entity_1.ProjectStatus.COMPLETED &&
        project.status !== project_entity_1.ProjectStatus.CANCELLED).length;
    const completedProjects = projects.filter((project) => project.status === project_entity_1.ProjectStatus.COMPLETED).length;
    const totalProjectValues = projects.reduce((sum, project) => sum + (project.total_amount || 0), 0);
    const completionRate = totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0;
    return {
        total_projects: totalProjects,
        active_projects: activeProjects,
        completed_projects: completedProjects,
        total_team_members: uniqueTeamMembers.size,
        phase_statistics: phaseStats,
        monthly_growth: monthlyGrowth,
        total_project_values: totalProjectValues,
        completion_rate: completionRate,
    };
}
//# sourceMappingURL=stats.js.map