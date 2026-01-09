import { Injectable, NotFoundException, BadRequestException, forwardRef, Inject } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Project } from "../../entities/project.entity";
import { Phase } from "../../entities/phase.entity";
import { ProjectsService } from "../projects.service";

@Injectable()
export class ProjectConsultantService {
  constructor(
    @InjectRepository(Project)
    private readonly projectsRepository: Repository<Project>,
    @InjectRepository(Phase)
    private readonly phasesRepository: Repository<Phase>,
    @Inject(forwardRef(() => ProjectsService))
    private readonly projectsService: ProjectsService
  ) {}

  /**
   * Get all consultant projects with calculated progress
   */
  async getAllConsultantProjects(): Promise<any[]> {
    const projects = await this.projectsRepository.find({
      relations: ["phases", "phases.subPhases", "owner", "collaborators"],
    });
    
    const calculatePhaseCompletion = (phase: Phase): number => {
      if (!phase.subPhases || phase.subPhases.length === 0) {
        return phase.progress || 0;
      }
      const completed = phase.subPhases.filter((sp) => sp.isCompleted).length;
      return Math.round((completed / phase.subPhases.length) * 100);
    };

    return projects.map((project) => {
      const phases = project.phases || [];
      const projectProgress =
        phases.length > 0
          ? Math.round(
              phases.reduce((sum, p) => sum + calculatePhaseCompletion(p), 0) /
                phases.length
            )
          : 0;
      const completedPhases = phases.filter(
        (p) => p.status === "completed"
      ).length;

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
        collaborators: (project.collaborators || []).map(
          (c) => c.display_name || c.id
        ),
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

  /**
   * Get paginated consultant projects
   */
  async getAllConsultantProjectsPaginated(
    page: number = 1,
    limit: number = 10,
    search?: string,
    status?: string
  ): Promise<{
    items: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    const qb = this.projectsRepository
      .createQueryBuilder("project")
      .leftJoinAndSelect("project.phases", "phases")
      .leftJoinAndSelect("phases.subPhases", "subPhases")
      .leftJoinAndSelect("project.owner", "owner")
      .leftJoinAndSelect("project.collaborators", "collaborators");

    if (search) {
      qb.andWhere(
        "(project.title ILIKE :search OR project.description ILIKE :search)",
        { search: `%${search}%` }
      );
    }

    if (status) {
      qb.andWhere("project.status = :status", { status });
    }

    qb.orderBy("project.created_at", "DESC")
      .skip((pageNum - 1) * limitNum)
      .take(limitNum);

    const [projects, total] = await qb.getManyAndCount();

    const calculatePhaseCompletion = (phase: Phase): number => {
      if (!phase.subPhases || phase.subPhases.length === 0) {
        return phase.progress || 0;
      }
      const completed = phase.subPhases.filter((sp) => sp.isCompleted).length;
      return Math.round((completed / phase.subPhases.length) * 100);
    };

    const items = projects.map((project) => {
      const phases = project.phases || [];
      const projectProgress =
        phases.length > 0
          ? Math.round(
              phases.reduce((sum, p) => sum + calculatePhaseCompletion(p), 0) /
                phases.length
            )
          : 0;

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
        collaborators: (project.collaborators || []).map(
          (c) => c.display_name || c.id
        ),
        tags: project.tags || [],
        isOwner: false,
        isCollaborator: true,
        hasPendingInvite: false,
      };
    });

    return {
      items,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  /**
   * Get consultant project details
   */
  async getConsultantProjectDetails(id: string): Promise<any> {
    const project = await this.projectsService.findOne(id);
    
    const phases = project.phases || [];
    const calculatePhaseCompletion = (phase: Phase): number => {
      if (!phase.subPhases || phase.subPhases.length === 0) {
        return phase.progress || 0;
      }
      const completed = phase.subPhases.filter((sp) => sp.isCompleted).length;
      return Math.round((completed / phase.subPhases.length) * 100);
    };

    const projectProgress =
      phases.length > 0
        ? Math.round(
            phases.reduce((sum, p) => sum + calculatePhaseCompletion(p), 0) /
              phases.length
          )
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
      collaborators: (project.collaborators || []).map(
        (c) => c.display_name || c.id
      ),
      tags: project.tags || [],
    };
  }

  /**
   * Get consultant project phases
   */
  async getConsultantProjectPhases(projectId: string): Promise<any[]> {
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

  /**
   * Get paginated consultant project phases
   */
  async getConsultantProjectPhasesPaginated(
    projectId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    items: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
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

  /**
   * Get BOQ draft phases for a project
   */
  async getBoqDraftPhases(projectId: string, userId: string): Promise<Phase[]> {
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

  /**
   * Activate BOQ phases - delegate to projectsService for now
   * This method has complex logic with activity logging, so keeping it in main service
   */
  async activateBoqPhases(
    projectId: string,
    phaseIds: string[],
    userId: string
  ): Promise<{ activated: number; phases: Phase[] }> {
    // This method has complex activity logging logic, so we'll keep it in ProjectsService
    // and just delegate here
    return this.projectsService.activateBoqPhases(projectId, phaseIds, userId);
  }

  /**
   * Get consultant project tasks
   */
  async getConsultantProjectTasks(projectId: string): Promise<any[]> {
    const project = await this.projectsRepository.findOne({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException("Project not found");
    }
    
    const phases = await this.phasesRepository.find({
      where: { project_id: projectId },
      relations: ["tasks"],
    });

    const allTasks = phases.flatMap((phase) =>
      phase.tasks.map((task) => ({
        id: task.id,
        description: task.description,
        unit: task.unit,
        quantity: task.quantity,
        price: task.price,
        phase_id: phase.id,
        phase_title: phase.title,
        created_at: task.created_at,
      }))
    );

    return allTasks;
  }
}

