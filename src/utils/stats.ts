import { Project, ProjectStatus } from "../entities/project.entity";
import { Phase } from "../entities/phase.entity";

export interface DashboardStats {
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  total_team_members: number;
  phase_statistics: {
    total_phases: number;
    completed_phases: number;
    in_progress_phases: number;
    total_budget: number;
  };
  monthly_growth: number;
  total_project_values: number;
  completion_rate: number;
}

export function calculateStatsFromProjects(
  projects: Project[]
): DashboardStats {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Calculate unique team members
  const uniqueTeamMembers = new Set<string>();
  projects.forEach((project) => {
    project.collaborators?.forEach((collaborator) => {
      uniqueTeamMembers.add(collaborator.id);
    });
    if (project.owner_id) {
      uniqueTeamMembers.add(project.owner_id);
    }
  });

  // Calculate phase statistics
  const phaseStats = {
    total_phases: 0,
    completed_phases: 0,
    in_progress_phases: 0,
    total_budget: 0,
  };

  projects.forEach((project) => {
    const projectPhases: Phase[] = project.phases || [];
    phaseStats.total_phases += projectPhases.length;
    phaseStats.completed_phases += projectPhases.filter(
      (phase) => phase.status === "completed"
    ).length;
    phaseStats.in_progress_phases += projectPhases.filter(
      (phase) => phase.status === "in_progress"
    ).length;
    phaseStats.total_budget += projectPhases.reduce(
      (sum, phase) => sum + (phase.budget || 0),
      0
    );
  });

  // Calculate monthly growth
  const lastMonthProjects = projects.filter(
    (project) =>
      project.created_at >= lastMonth && project.created_at < thisMonth
  ).length;
  const thisMonthProjects = projects.filter(
    (project) => project.created_at >= thisMonth && project.created_at <= now
  ).length;
  const monthlyGrowth =
    lastMonthProjects === 0
      ? 100
      : ((thisMonthProjects - lastMonthProjects) / lastMonthProjects) * 100;

  // Calculate project counts
  const totalProjects = projects.length;
  const activeProjects = projects.filter(
    (project) =>
      project.status !== ProjectStatus.COMPLETED &&
      project.status !== ProjectStatus.CANCELLED
  ).length;
  const completedProjects = projects.filter(
    (project) => project.status === ProjectStatus.COMPLETED
  ).length;

  // Calculate total project values
  const totalProjectValues = projects.reduce(
    (sum, project) => sum + (project.totalAmount || 0),
    0
  );

  const completionRate =
    totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0;

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
