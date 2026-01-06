import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
  forwardRef,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SubPhase } from "../entities/sub-phase.entity";
import { ActivitiesService } from "../activities/activities.service";
import { Phase } from "../entities/phase.entity";
import { Project } from "../entities/project.entity";
import { User, UserRole } from "../entities/user.entity";
import { ActivityType } from "../entities/activity.entity";
import { UsersService } from "../users/users.service";

@Injectable()
export class SubPhasesService {
  constructor(
    @InjectRepository(SubPhase)
    private readonly subPhaseRepository: Repository<SubPhase>,
    @InjectRepository(Phase)
    private readonly phaseRepository: Repository<Phase>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @Inject(forwardRef(() => ActivitiesService))
    private readonly activitiesService: ActivitiesService,
    private readonly usersService: UsersService
  ) {}

  async create(
    phaseId: string,
    createDto: { title: string; description?: string; parentSubPhaseId?: string },
    user?: User
  ): Promise<SubPhase> {
    if (!user) {
      throw new ForbiddenException("User must be authenticated to create sub-phases");
    }

    // Verify phase exists
    const phase = await this.phaseRepository.findOne({
      where: { id: phaseId },
      relations: ["project", "project.owner", "project.collaborators"],
    });
    if (!phase) throw new NotFoundException("Phase not found");

    // If parentSubPhaseId is provided, verify it exists and belongs to the same phase
    let parentSubPhase: SubPhase | null = null;
    if (createDto.parentSubPhaseId) {
      parentSubPhase = await this.subPhaseRepository.findOne({
        where: { id: createDto.parentSubPhaseId },
        relations: ["phase"],
      });
      
      if (!parentSubPhase) {
        throw new NotFoundException("Parent sub-phase not found");
      }
      
      if (parentSubPhase.phase_id !== phaseId) {
        throw new ForbiddenException(
          "Parent sub-phase must belong to the same phase"
        );
      }
    }

    // Check permissions: sub_contractors, contractors, project owners, admins, and consultants can create sub-phases
    const userWithRole = await this.usersService.findOne(user.id);
    const isSubContractor = userWithRole?.role === UserRole.SUB_CONTRACTOR;
    const isContractor = userWithRole?.role === UserRole.CONTRACTOR;
    const isAdmin = userWithRole?.role === UserRole.ADMIN;
    const isConsultant = userWithRole?.role === UserRole.CONSULTANT;
    const isOwner = phase.project?.owner_id === user.id;
    const isCollaborator = phase.project?.collaborators?.some(
      (c) => c.id === user.id
    );

    // Special permission: sub_contractors can create nested sub-phases (sub-phases within sub-phases)
    // Contractors can create top-level sub-phases, sub_contractors can create nested ones
    if (createDto.parentSubPhaseId) {
      // Creating a nested sub-phase - only sub_contractors can do this
      if (!isSubContractor && !isAdmin && !isConsultant && !isOwner) {
        throw new ForbiddenException(
          "Only sub_contractors, project owners, admins, or consultants can create nested sub-phases"
        );
      }
    } else {
      // Creating a top-level sub-phase - contractors and sub_contractors can do this
      if (
        !isSubContractor &&
        !isContractor &&
        !isAdmin &&
        !isConsultant &&
        !isOwner &&
        !isCollaborator
      ) {
        throw new ForbiddenException(
          "Only sub_contractors, contractors, project owners, collaborators, admins, or consultants can create sub-phases"
        );
      }
    }

    // Create sub-phase
    const subPhase = this.subPhaseRepository.create({
      title: createDto.title,
      description: createDto.description,
      phase_id: phaseId,
      parent_sub_phase_id: createDto.parentSubPhaseId || null,
      isCompleted: false,
    });

    const saved = await this.subPhaseRepository.save(subPhase);

    // Log activity
    if (phase.project && user) {
      await this.activitiesService.createActivity(
        ActivityType.TASK_CREATED,
        `Sub-phase "${subPhase.title}" was added to phase "${phase.title}"`,
        user,
        phase.project,
        phase,
        { subPhaseId: saved.id }
      );
    }

    return saved;
  }

  async update(
    id: string,
    update: Partial<SubPhase>,
    user?: User
  ): Promise<SubPhase> {
    if (!user) {
      throw new ForbiddenException("User must be authenticated to update sub-phases");
    }

    const subPhase = await this.subPhaseRepository.findOne({
      where: { id },
      relations: [
        "phase", 
        "phase.project", 
        "phase.project.owner", 
        "phase.project.collaborators",
        "subPhases" // Load nested sub-phases to check their completion status
      ],
    });
    if (!subPhase) throw new NotFoundException("SubPhase not found");

    // Check permissions: sub_contractors, contractors, project owners, admins, and consultants can update sub-phases
    const userWithRole = await this.usersService.findOne(user.id);
    const isSubContractor = userWithRole?.role === UserRole.SUB_CONTRACTOR;
    const isContractor = userWithRole?.role === UserRole.CONTRACTOR;
    const isAdmin = userWithRole?.role === UserRole.ADMIN;
    const isConsultant = userWithRole?.role === UserRole.CONSULTANT;
    const isOwner = subPhase.phase?.project?.owner_id === user.id;
    const isCollaborator = subPhase.phase?.project?.collaborators?.some(
      (c) => c.id === user.id
    );

    if (
      !isSubContractor &&
      !isContractor &&
      !isAdmin &&
      !isConsultant &&
      !isOwner &&
      !isCollaborator
    ) {
      throw new ForbiddenException(
        "Only sub_contractors, contractors, project owners, collaborators, admins, or consultants can update sub-phases"
      );
    }

    // If trying to mark as completed, check if all nested sub-phases are completed
    if (update.isCompleted === true && subPhase.isCompleted !== true) {
      // Recursively check all nested sub-phases
      const hasIncompleteNested = await this.hasIncompleteNestedSubPhases(id);
      if (hasIncompleteNested) {
        throw new ForbiddenException(
          "Cannot mark sub-phase as completed. All nested sub-phases must be completed first."
        );
      }
    }

    Object.assign(subPhase, update);
    const saved = await this.subPhaseRepository.save(subPhase);

    // Fetch the parent phase and project for logging
    const phase = await this.phaseRepository.findOne({
      where: { id: subPhase.phase_id },
      relations: ["project", "subPhases"],
    });
    if (phase) {
      // Check if all subphases are completed
      const allCompleted = (phase.subPhases || []).every(
        (sp) => sp.isCompleted
      );
      // Import PhaseStatus enum
      let PhaseStatus;
      try {
        PhaseStatus = (await import("../entities/phase.entity")).PhaseStatus;
      } catch (e) {
        PhaseStatus = null;
      }
      let newStatus = phase.status;
      if (PhaseStatus) {
        if (allCompleted && phase.status !== PhaseStatus.COMPLETED) {
          newStatus = PhaseStatus.COMPLETED;
        } else if (!allCompleted && phase.status === PhaseStatus.COMPLETED) {
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
        await this.activitiesService.createActivity(
          ActivityType.TASK_UPDATED,
          `SubPhase "${subPhase.title}" was updated (isCompleted: ${subPhase.isCompleted})`,
          user,
          project,
          phase,
          { subPhaseId: subPhase.id, isCompleted: subPhase.isCompleted }
        );
      }
    }
    return saved;
  }

  async findOne(id: string): Promise<SubPhase | null> {
    return this.subPhaseRepository.findOne({
      where: { id },
      relations: ["phase", "parentSubPhase", "subPhases"],
    });
  }

  async searchSubPhases(
    projectId: string,
    search: string
  ): Promise<Array<{ subPhase: SubPhase; phase: Phase }>> {
    if (!search || search.trim().length === 0) {
      return [];
    }

    const searchTerm = `%${search.trim()}%`;

    // Search sub-phases by title or description, filtered by project (including nested sub-phases)
    const subPhases = await this.subPhaseRepository
      .createQueryBuilder("subPhase")
      .leftJoinAndSelect("subPhase.phase", "phase")
      .leftJoinAndSelect("subPhase.parentSubPhase", "parentSubPhase")
      .leftJoinAndSelect("subPhase.subPhases", "subPhases")
      .leftJoin("phase.project", "project")
      .where("project.id = :projectId", { projectId })
      .andWhere(
        "(subPhase.title ILIKE :search OR subPhase.description ILIKE :search)",
        { search: searchTerm }
      )
      .getMany();

    // Get the phases for each sub-phase
    const result = await Promise.all(
      subPhases.map(async (subPhase) => {
        const phase = await this.phaseRepository.findOne({
          where: { id: subPhase.phase_id },
        });
        return {
          subPhase,
          phase: phase || null,
        };
      })
    );

    return result.filter((item) => item.phase !== null);
  }

  /**
   * Recursively check if a sub-phase or any of its nested sub-phases are incomplete
   * @param subPhaseId The ID of the sub-phase to check
   * @returns true if there are incomplete nested sub-phases, false otherwise
   */
  private async hasIncompleteNestedSubPhases(subPhaseId: string): Promise<boolean> {
    // Load all nested sub-phases recursively using a query builder
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

    // Recursively check all nested sub-phases
    return this.checkNestedSubPhasesRecursive(subPhase);
  }

  /**
   * Helper method to recursively check nested sub-phases
   * @param subPhase The sub-phase to check
   * @returns true if any nested sub-phase is incomplete
   */
  private checkNestedSubPhasesRecursive(subPhase: SubPhase): boolean {
    if (!subPhase.subPhases || subPhase.subPhases.length === 0) {
      // No nested sub-phases, so it's safe
      return false;
    }

    // Check if any direct nested sub-phase is incomplete
    for (const nested of subPhase.subPhases) {
      if (!nested.isCompleted) {
        return true;
      }
      
      // Recursively check deeper levels
      if (this.checkNestedSubPhasesRecursive(nested)) {
        return true;
      }
    }

    return false;
  }
}
