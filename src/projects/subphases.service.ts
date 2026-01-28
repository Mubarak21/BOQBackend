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
import { ContractorPhase } from "../entities/contractor-phase.entity";
import { SubContractorPhase } from "../entities/sub-contractor-phase.entity";
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
    @InjectRepository(ContractorPhase)
    private readonly contractorPhaseRepository: Repository<ContractorPhase>,
    @InjectRepository(SubContractorPhase)
    private readonly subContractorPhaseRepository: Repository<SubContractorPhase>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @Inject(forwardRef(() => ActivitiesService))
    private readonly activitiesService: ActivitiesService,
    private readonly usersService: UsersService
  ) {}

  async create(
    phaseId: string,
    createDto: { title: string; description?: string; parentSubPhaseId?: string; isCompleted?: boolean },
    user?: User
  ): Promise<SubPhase> {
    if (!user) {
      throw new ForbiddenException("User must be authenticated to create sub-phases");
    }

    // Verify phase exists - check all phase tables
    let phase: any = null;
    let phaseType: 'contractor' | 'sub_contractor' | 'legacy' = 'legacy';
    let isLinkedSubContractorPhase = false;

    // Check contractor_phases table
    const contractorPhase = await this.contractorPhaseRepository.findOne({
      where: { id: phaseId },
      relations: ["project", "project.owner", "project.collaborators"],
    });
    if (contractorPhase) {
      phase = contractorPhase;
      phaseType = 'contractor';
    } else {
      // Check sub_contractor_phases table
      const subContractorPhase = await this.subContractorPhaseRepository.findOne({
        where: { id: phaseId },
        relations: ["project", "project.owner", "project.collaborators", "linkedContractorPhase"],
      });
      if (subContractorPhase) {
        phase = subContractorPhase;
        phaseType = 'sub_contractor';
        // Check if this sub-contractor phase is linked to a contractor phase
        if (subContractorPhase.linkedContractorPhaseId) {
          isLinkedSubContractorPhase = true;
        }
      } else {
        // Check legacy Phase table
        const legacyPhase = await this.phaseRepository.findOne({
          where: { id: phaseId },
          relations: ["project", "project.owner", "project.collaborators"],
        });
        if (legacyPhase) {
          phase = legacyPhase;
          phaseType = 'legacy';
          // Check if legacy phase is a linked sub-contractor phase
          if (legacyPhase.boqType === 'sub_contractor' && legacyPhase.linkedContractorPhaseId) {
            isLinkedSubContractorPhase = true;
          }
        }
      }
    }

    if (!phase) throw new NotFoundException("Phase not found");

    // If parentSubPhaseId is provided, verify it exists and belongs to the same phase
    let parentSubPhase: SubPhase | null = null;
    if (createDto.parentSubPhaseId) {
      parentSubPhase = await this.subPhaseRepository.findOne({
        where: { id: createDto.parentSubPhaseId },
        relations: ["phase", "subContractorPhase", "subContractorPhase.linkedContractorPhase"],
      });
      
      if (!parentSubPhase) {
        throw new NotFoundException("Parent sub-phase not found");
      }
      
      // Check if parent sub-phase belongs to the same phase (check all phase types)
      const parentBelongsToPhase = 
        parentSubPhase.phase_id === phaseId ||
        parentSubPhase.contractorPhaseId === phaseId ||
        parentSubPhase.subContractorPhaseId === phaseId;
      
      if (!parentBelongsToPhase) {
        throw new ForbiddenException(
          "Parent sub-phase must belong to the same phase"
        );
      }

      // Check if parent sub-phase belongs to a linked sub-contractor phase
      if (parentSubPhase.subContractorPhaseId) {
        if (parentSubPhase.subContractorPhase?.linkedContractorPhaseId) {
          isLinkedSubContractorPhase = true;
        } else {
          // Fallback: fetch if not loaded
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

    // Check permissions: sub_contractors, contractors, project owners, admins, and consultants can create sub-phases
    const userWithRole = await this.usersService.findOne(user.id);
    const isSubContractor = userWithRole?.role === UserRole.SUB_CONTRACTOR;
    const isContractor = userWithRole?.role === UserRole.CONTRACTOR;
    const isAdmin = userWithRole?.role === UserRole.CONSULTANT;
    const isConsultant = userWithRole?.role === UserRole.CONSULTANT;
    const isOwner = phase.project?.owner_id === user.id;
    const isCollaborator = phase.project?.collaborators?.some(
      (c) => c.id === user.id
    );

    // Contractors cannot create sub-phases on linked sub-contractor phases
    if (isContractor && isLinkedSubContractorPhase && !isAdmin && !isConsultant && !isOwner) {
      throw new ForbiddenException(
        "Contractors can only view sub-phases from linked sub-contractor phases. Only the sub-contractor can create or modify them."
      );
    }

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

    // Create sub-phase - link to the correct phase table
    const subPhaseData: any = {
      title: createDto.title,
      description: createDto.description,
      parent_sub_phase_id: createDto.parentSubPhaseId || null,
      isCompleted: createDto.isCompleted || false,
    };

    // Link to the correct phase table based on phase type
    if (phaseType === 'contractor') {
      subPhaseData.contractorPhaseId = phaseId;
    } else if (phaseType === 'sub_contractor') {
      subPhaseData.subContractorPhaseId = phaseId;
    } else {
      subPhaseData.phase_id = phaseId;
    }

    const subPhase = this.subPhaseRepository.create(subPhaseData);

    const saved = await this.subPhaseRepository.save(subPhase);
    const savedSubPhase = Array.isArray(saved) ? saved[0] : saved;

    // Log activity
    if (phase.project && user) {
      await this.activitiesService.createActivity(
        ActivityType.TASK_CREATED,
        `Sub-phase "${savedSubPhase.title}" was added to phase "${phase.title || phase.name}"`,
        user,
        phase.project,
        phase,
        { subPhaseId: savedSubPhase.id }
      );
    }

    return savedSubPhase;
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
        "subPhases", // Load nested sub-phases to check their completion status
        "subContractorPhase", // Load sub-contractor phase to check if it's linked
        "subContractorPhase.linkedContractorPhase" // Load linked contractor phase
      ],
    });
    if (!subPhase) throw new NotFoundException("SubPhase not found");

    // Check permissions: sub_contractors, contractors, project owners, admins, and consultants can update sub-phases
    const userWithRole = await this.usersService.findOne(user.id);
    const isSubContractor = userWithRole?.role === UserRole.SUB_CONTRACTOR;
    const isContractor = userWithRole?.role === UserRole.CONTRACTOR;
    const isAdmin = userWithRole?.role === UserRole.CONSULTANT;
    const isConsultant = userWithRole?.role === UserRole.CONSULTANT;
    const isOwner = subPhase.phase?.project?.owner_id === user.id;
    const isCollaborator = subPhase.phase?.project?.collaborators?.some(
      (c) => c.id === user.id
    );

    // Check if this sub-phase belongs to a linked sub-contractor phase
    // If it does, contractors can only view it, not modify it
    let isLinkedSubContractorPhase = false;
    if (subPhase.subContractorPhaseId) {
      // Check if the sub-contractor phase is linked to a contractor phase
      if (subPhase.subContractorPhase?.linkedContractorPhaseId) {
        isLinkedSubContractorPhase = true;
      } else {
        // Fallback: fetch if not loaded
        const subContractorPhase = await this.subContractorPhaseRepository.findOne({
          where: { id: subPhase.subContractorPhaseId },
          relations: ["linkedContractorPhase"],
        });
        if (subContractorPhase?.linkedContractorPhaseId) {
          isLinkedSubContractorPhase = true;
        }
      }
    }

    // Contractors cannot modify sub-phases that belong to linked sub-contractor phases
    if (isContractor && isLinkedSubContractorPhase && !isAdmin && !isConsultant && !isOwner) {
      throw new ForbiddenException(
        "Contractors can only view sub-phases from linked sub-contractor phases. Only the sub-contractor can modify them."
      );
    }

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

    // Fetch the parent phase - could be from contractor_phases, sub_contractor_phases, or legacy Phase table
    let phase: any = null;
    let project: any = null;
    let phaseType: 'contractor' | 'sub_contractor' | 'legacy' = 'legacy';

    // Check contractor_phases table
    if (subPhase.contractorPhaseId) {
      phase = await this.contractorPhaseRepository.findOne({
        where: { id: subPhase.contractorPhaseId },
        relations: ["project", "subPhases"],
      });
      phaseType = 'contractor';
    }
    // Check sub_contractor_phases table
    else if (subPhase.subContractorPhaseId) {
      phase = await this.subContractorPhaseRepository.findOne({
        where: { id: subPhase.subContractorPhaseId },
        relations: ["project", "subPhases", "linkedContractorPhase"],
      });
      phaseType = 'sub_contractor';
    }
    // Check legacy Phase table
    else if (subPhase.phase_id) {
      phase = await this.phaseRepository.findOne({
        where: { id: subPhase.phase_id },
        relations: ["project", "subPhases"],
      });
      phaseType = 'legacy';
    }

    if (phase) {
      project = phase.project;
      
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
          
          // Save phase in the correct table
          if (phaseType === 'contractor') {
            await this.contractorPhaseRepository.save(phase);
            
            // Sync to linked sub-contractor phases
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
          } else if (phaseType === 'sub_contractor') {
            await this.subContractorPhaseRepository.save(phase);
            
            // Sync to linked contractor phase
            if (phase.linkedContractorPhaseId) {
              const linkedContractorPhase = await this.contractorPhaseRepository.findOne({
                where: { id: phase.linkedContractorPhaseId, project_id: phase.project_id },
                relations: ["subPhases"],
              });
              
              if (linkedContractorPhase) {
                // Check if all linked sub-contractor phases are completed
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
                } else if (!allLinkedCompleted && linkedContractorPhase.status === PhaseStatus.COMPLETED) {
                  linkedContractorPhase.status = PhaseStatus.IN_PROGRESS;
                  // Recalculate progress
                  const completedCount = allLinkedSubContractorPhases.filter(p => p.status === PhaseStatus.COMPLETED).length;
                  linkedContractorPhase.progress = Math.min(100, (completedCount / allLinkedSubContractorPhases.length) * 100);
                  await this.contractorPhaseRepository.save(linkedContractorPhase);
                }
              }
            }
          } else {
            await this.phaseRepository.save(phase);
          }
        }
      }
      
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
