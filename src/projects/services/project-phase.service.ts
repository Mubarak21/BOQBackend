import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  forwardRef,
  Inject,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In, DataSource, QueryRunner } from "typeorm";
import { Phase, PhaseStatus } from "../../entities/phase.entity";
import { ContractorPhase } from "../../entities/contractor-phase.entity";
import { SubContractorPhase } from "../../entities/sub-contractor-phase.entity";
import { Project } from "../../entities/project.entity";
import { Task } from "../../entities/task.entity";
import { User } from "../../entities/user.entity";
import { CreatePhaseDto } from "../dto/create-phase.dto";
import { UpdatePhaseDto } from "../dto/update-phase.dto";
import { UsersService } from "../../users/users.service";
import { ActivitiesService } from "../../activities/activities.service";
import { ActivityType } from "../../entities/activity.entity";
import { ProjectsService } from "../projects.service";

@Injectable()
export class ProjectPhaseService {
  constructor(
    @InjectRepository(Phase)
    private readonly phasesRepository: Repository<Phase>,
    @InjectRepository(ContractorPhase)
    private readonly contractorPhasesRepository: Repository<ContractorPhase>,
    @InjectRepository(SubContractorPhase)
    private readonly subContractorPhasesRepository: Repository<SubContractorPhase>,
    @InjectRepository(Project)
    private readonly projectsRepository: Repository<Project>,
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => ActivitiesService))
    private readonly activitiesService: ActivitiesService,
    @Inject(forwardRef(() => ProjectsService))
    private readonly projectsService: ProjectsService,
    private readonly dataSource: DataSource
  ) {}

  async createPhase(
    projectId: string,
    createPhaseDto: CreatePhaseDto,
    userId: string
  ): Promise<Phase> {
    if (!projectId || projectId.trim() === "") {
      throw new BadRequestException(
        "Project ID is required when creating a phase"
      );
    }

    const project = await this.projectsService.findOne(projectId, userId);

    if (!project || !project.id) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    const existingPhase = await this.phasesRepository.findOne({
      where: { project_id: projectId, title: createPhaseDto.title },
    });
    if (existingPhase) {
      throw new BadRequestException(
        "A phase with this title already exists for this project."
      );
    }

    let status = createPhaseDto.status;
    if (createPhaseDto.startDate) {
      const startDate = new Date(createPhaseDto.startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (
        (!status || status === PhaseStatus.NOT_STARTED) &&
        startDate <= today
      ) {
        status = PhaseStatus.IN_PROGRESS;
      }
    }

    if (!projectId || projectId.trim() === "") {
      throw new BadRequestException(
        "Project ID is required when creating a phase"
      );
    }

    // Get user to determine BOQ type and validate linking
    const user = await this.usersService.findOne(userId);
    const userRole = user?.role?.toLowerCase();
    
    // Determine BOQ type based on user role
    let boqType: "contractor" | "sub_contractor" | null = null;
    if (userRole === 'contractor') {
      boqType = 'contractor';
    } else if (userRole === 'sub_contractor') {
      boqType = 'sub_contractor';
    }

    // Validate linking if sub-contractor is linking to contractor phase
    let linkedContractorPhaseId: string | null = null;
    if (createPhaseDto.linkedContractorPhaseId) {
      if (userRole !== 'sub_contractor') {
        throw new BadRequestException(
          "Only sub-contractors can link phases to contractor phases"
        );
      }
      
      // Verify the contractor phase exists and belongs to the same project
      const contractorPhase = await this.contractorPhasesRepository.findOne({
        where: {
          id: createPhaseDto.linkedContractorPhaseId,
          project_id: projectId,
        },
      });
      
      if (!contractorPhase) {
        // Also check legacy Phase table
        const legacyPhase = await this.phasesRepository.findOne({
          where: {
            id: createPhaseDto.linkedContractorPhaseId,
            project_id: projectId,
            boqType: 'contractor',
          },
        });
        
        if (!legacyPhase) {
          throw new NotFoundException(
            "Contractor phase not found or does not belong to this project"
          );
        }
      }
      
      linkedContractorPhaseId = createPhaseDto.linkedContractorPhaseId;
    }

    // Use QueryRunner for transaction management
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
    const phaseData = {
      title: createPhaseDto.title,
      description: createPhaseDto.description,
      deliverables: createPhaseDto.deliverables,
      requirements: createPhaseDto.requirements,
      start_date: createPhaseDto.startDate,
      end_date: createPhaseDto.endDate,
      due_date: createPhaseDto.dueDate,
      budget: createPhaseDto.budget,
      progress: createPhaseDto.progress,
      status,
      project_id: projectId,
        is_active: true,
        from_boq: false,
      };

      // Create phase in the correct table based on user role
      let savedPhase: any;
      if (userRole === 'contractor') {
        // Create in contractor_phases table
        const contractorPhase = queryRunner.manager.create(ContractorPhase, {
      ...phaseData,
      project: project,
    });
        savedPhase = await queryRunner.manager.save(ContractorPhase, contractorPhase);
      } else if (userRole === 'sub_contractor') {
        // Create in sub_contractor_phases table
        const subContractorPhase = queryRunner.manager.create(SubContractorPhase, {
          ...phaseData,
          project: project,
          linkedContractorPhaseId: linkedContractorPhaseId,
        });
        savedPhase = await queryRunner.manager.save(SubContractorPhase, subContractorPhase);
      } else {
        // Consultants and other roles create in legacy Phase table
        const phaseDataLegacy = {
          ...phaseData,
          boqType,
          linked_contractor_phase_id: linkedContractorPhaseId,
          parent_phase_id: createPhaseDto.parentPhaseId || null,
          reference_task_id: createPhaseDto.referenceTaskId || null,
          project: project,
        };
        const phase = queryRunner.manager.create(Phase, phaseDataLegacy);
        savedPhase = await queryRunner.manager.save(Phase, phase);
      }

      // Create/update tasks within transaction
      if (createPhaseDto.tasks?.length) {
        for (const taskDto of createPhaseDto.tasks) {
          if (taskDto.id) {
            // Update task to link to the correct phase
            const updateData: any = { project_id: projectId };
            if (userRole === 'contractor') {
              updateData.contractorPhaseId = savedPhase.id;
            } else if (userRole === 'sub_contractor') {
              updateData.subContractorPhaseId = savedPhase.id;
            } else {
              updateData.phase_id = savedPhase.id;
            }
            await queryRunner.manager.update(Task, { id: taskDto.id }, updateData);
          } else {
            // Create new task linked to the correct phase
            const taskData: any = {
              ...taskDto,
              project_id: projectId,
            };
            
            if (userRole === 'contractor') {
              taskData.contractorPhaseId = savedPhase.id;
            } else if (userRole === 'sub_contractor') {
              taskData.subContractorPhaseId = savedPhase.id;
            } else {
              taskData.phase_id = savedPhase.id;
            }
            
            const newTask = queryRunner.manager.create(Task, taskData);
            await queryRunner.manager.save(Task, newTask);
          }
        }
      }

      await queryRunner.commitTransaction();
      
      // Log activity outside transaction (activity logging failures shouldn't rollback critical operations)
      try {
    await this.activitiesService.createActivity(
      ActivityType.TASK_CREATED,
      `Phase "${savedPhase.title}" was created`,
      user,
      project,
      savedPhase,
      { phaseId: savedPhase.id }
    );
      } catch (activityError) {
        // Log error but don't fail the operation
        console.error('Failed to log activity:', activityError);
      }
      
      // Normalize response to match Phase interface
      return this.normalizePhaseResponse(savedPhase);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // Helper method to normalize phase response
  private normalizePhaseResponse(phase: any): any {
    return {
      id: phase.id,
      name: phase.title,
      title: phase.title,
      description: phase.description,
      status: phase.status,
      budget: phase.budget,
      progress: phase.progress,
      startDate: phase.start_date,
      start_date: phase.start_date,
      endDate: phase.end_date,
      end_date: phase.end_date,
      subPhases: phase.subPhases || [],
      created_at: phase.created_at,
      updated_at: phase.updated_at,
    };
  }

  async updatePhase(
    projectId: string,
    phaseId: string,
    updatePhaseDto: UpdatePhaseDto,
    userId: string
  ): Promise<Phase> {
    if (!projectId || projectId.trim() === "") {
      throw new BadRequestException(
        "Project ID is required when updating a phase"
      );
    }

    const project = await this.projectsRepository.findOne({
      where: { id: projectId },
    });
    if (!project) throw new NotFoundException("Project not found");

    const user = await this.usersService.findOne(userId);
    const isContractor = user?.role === "contractor";
    const isSubContractor = user?.role === "sub_contractor";
    const isAdmin = user?.role === "consultant";
    const isConsultant = user?.role === "consultant";
    const isOwner = project.owner_id === userId;

    if (
      !isOwner &&
      !isContractor &&
      !isSubContractor &&
      !isAdmin &&
      !isConsultant
    ) {
      throw new ForbiddenException(
        "Only the project owner, contractor, sub_contractor, admin, or consultant can update a phase"
      );
    }

    const updateData: any = {
      title: updatePhaseDto.title,
      description: updatePhaseDto.description,
      deliverables: updatePhaseDto.deliverables,
      requirements: updatePhaseDto.requirements,
      start_date: updatePhaseDto.startDate,
      end_date: updatePhaseDto.endDate,
      due_date: updatePhaseDto.dueDate,
      budget: updatePhaseDto.budget,
      progress: updatePhaseDto.progress,
      status: updatePhaseDto.status,
      parent_phase_id: updatePhaseDto.parentPhaseId || null,
      reference_task_id: updatePhaseDto.referenceTaskId || null,
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    // Use QueryRunner for transaction management (critical for syncing linked phases)
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Try to find phase in contractor_phases table first
      let contractorPhase = await queryRunner.manager.findOne(ContractorPhase, {
        where: { id: phaseId, project_id: projectId },
        relations: ["linkedSubContractorPhases"],
      });

      // Try to find phase in sub_contractor_phases table
      let subContractorPhase = await queryRunner.manager.findOne(SubContractorPhase, {
        where: { id: phaseId, project_id: projectId },
        relations: ["linkedContractorPhase"],
      });

      // Try to find phase in legacy Phase table
      let legacyPhase = await queryRunner.manager.findOne(Phase, {
        where: { id: phaseId, project_id: projectId },
      });

      let updatedPhase: any;
      let phaseType: 'contractor' | 'sub_contractor' | 'legacy' = 'legacy';

      if (contractorPhase) {
        phaseType = 'contractor';
        Object.assign(contractorPhase, updateData);
        if (!contractorPhase.project_id) {
          contractorPhase.project_id = projectId;
        }
        updatedPhase = await queryRunner.manager.save(ContractorPhase, contractorPhase);

        // Sync changes to linked sub-contractor phases
        // When contractor updates status, progress, or dates, sync to linked sub-contractor phases
        if (updatePhaseDto.status !== undefined || updatePhaseDto.progress !== undefined || 
            updatePhaseDto.startDate !== undefined || updatePhaseDto.endDate !== undefined) {
          const linkedSubContractorPhases = await queryRunner.manager.find(SubContractorPhase, {
            where: { 
              project_id: projectId,
              linkedContractorPhaseId: phaseId,
              is_active: true,
            },
          });

          for (const linkedPhase of linkedSubContractorPhases) {
            // Sync status if contractor phase is completed
            if (updatePhaseDto.status === 'completed' && linkedPhase.status !== PhaseStatus.COMPLETED) {
              linkedPhase.status = PhaseStatus.COMPLETED;
            }
            // Sync progress (sub-contractor progress should not exceed contractor progress)
            if (updatePhaseDto.progress !== undefined && linkedPhase.progress > updatePhaseDto.progress) {
              linkedPhase.progress = updatePhaseDto.progress;
            }
            // Sync dates if provided
            if (updatePhaseDto.startDate !== undefined) {
              linkedPhase.start_date = updatePhaseDto.startDate ? new Date(updatePhaseDto.startDate) : null;
            }
            if (updatePhaseDto.endDate !== undefined) {
              linkedPhase.end_date = updatePhaseDto.endDate ? new Date(updatePhaseDto.endDate) : null;
            }
            await queryRunner.manager.save(SubContractorPhase, linkedPhase);
          }
        }
      } else if (subContractorPhase) {
        phaseType = 'sub_contractor';
        Object.assign(subContractorPhase, updateData);
        if (!subContractorPhase.project_id) {
          subContractorPhase.project_id = projectId;
        }
        updatedPhase = await queryRunner.manager.save(SubContractorPhase, subContractorPhase);

        // Sync changes to linked contractor phase
        // When sub-contractor updates progress or status, update contractor phase accordingly
        if (subContractorPhase.linkedContractorPhaseId) {
          const linkedContractorPhase = await queryRunner.manager.findOne(ContractorPhase, {
            where: { id: subContractorPhase.linkedContractorPhaseId, project_id: projectId },
          });

          if (linkedContractorPhase) {
            // If sub-contractor completes their phase, update contractor phase progress
            if (updatePhaseDto.status === 'completed') {
              // Check if all linked sub-contractor phases are completed
              const allLinkedSubContractorPhases = await queryRunner.manager.find(SubContractorPhase, {
                where: { 
                  project_id: projectId,
                  linkedContractorPhaseId: subContractorPhase.linkedContractorPhaseId,
                  is_active: true,
                },
              });
              const allCompleted = allLinkedSubContractorPhases.every(p => p.status === PhaseStatus.COMPLETED);
              if (allCompleted && linkedContractorPhase.status !== PhaseStatus.COMPLETED) {
                linkedContractorPhase.status = PhaseStatus.COMPLETED;
                linkedContractorPhase.progress = 100;
              } else {
                // Update progress based on completed sub-contractor phases
                const completedCount = allLinkedSubContractorPhases.filter(p => p.status === PhaseStatus.COMPLETED).length;
                linkedContractorPhase.progress = Math.min(100, (completedCount / allLinkedSubContractorPhases.length) * 100);
              }
              await queryRunner.manager.save(ContractorPhase, linkedContractorPhase);
            } else if (updatePhaseDto.progress !== undefined) {
              // Aggregate progress from all linked sub-contractor phases
              const allLinkedSubContractorPhases = await queryRunner.manager.find(SubContractorPhase, {
                where: { 
                  project_id: projectId,
                  linkedContractorPhaseId: subContractorPhase.linkedContractorPhaseId,
                  is_active: true,
                },
              });
              const avgProgress = allLinkedSubContractorPhases.reduce((sum, p) => sum + (p.progress || 0), 0) / allLinkedSubContractorPhases.length;
              linkedContractorPhase.progress = Math.min(100, avgProgress);
              await queryRunner.manager.save(ContractorPhase, linkedContractorPhase);
            }
          }
        }
      } else if (legacyPhase) {
        phaseType = 'legacy';
        Object.assign(legacyPhase, updateData);
        if (!legacyPhase.project_id) {
          legacyPhase.project_id = projectId;
        }
        updatedPhase = await queryRunner.manager.save(Phase, legacyPhase);
      } else {
        throw new NotFoundException("Phase not found");
      }

      if (!updatedPhase.project_id || updatedPhase.project_id.trim() === "") {
        throw new BadRequestException("Phase must have a valid project_id");
      }

      await queryRunner.commitTransaction();

      // Log activity outside transaction (activity logging failures shouldn't rollback critical operations)
      try {
        await this.activitiesService.createActivity(
          ActivityType.TASK_UPDATED,
          `Phase "${updatedPhase.title || updatedPhase.name}" was updated`,
          user,
          project,
          updatedPhase,
          { phaseId: updatedPhase.id }
        );
      } catch (activityError) {
        console.error('Failed to log activity:', activityError);
      }

      // Log phase completion outside transaction
      if (
        updatePhaseDto.status === "completed" &&
        (phaseType === 'contractor' ? contractorPhase?.status : 
         phaseType === 'sub_contractor' ? subContractorPhase?.status : legacyPhase?.status) !== "completed"
      ) {
        try {
          // Get all phases for the project to calculate phase number
          let allPhases: any[] = [];
          if (phaseType === 'contractor') {
            allPhases = await this.contractorPhasesRepository.find({
              where: { project_id: projectId },
            });
          } else if (phaseType === 'sub_contractor') {
            allPhases = await this.subContractorPhasesRepository.find({
              where: { project_id: projectId },
            });
          } else {
            allPhases = await this.phasesRepository.find({
              where: { project_id: projectId },
            });
          }
          
          const phaseNumber = allPhases.findIndex((p) => p.id === phaseId) + 1;
          const totalPhases = allPhases.length;
          await this.activitiesService.logPhaseCompleted(
            user,
            project,
            updatedPhase,
            phaseNumber,
            totalPhases
          );

          if (
            updatedPhase.end_date &&
            new Date(updatedPhase.end_date) < new Date()
          ) {
            await this.activitiesService.logPhaseOverdue(
              user,
              project,
              updatedPhase,
              phaseNumber,
              totalPhases
            );
          }
        } catch (activityError) {
          console.error('Failed to log phase completion:', activityError);
        }
      }

      return this.normalizePhaseResponse(updatedPhase);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async deletePhase(
    projectId: string,
    phaseId: string,
    userId: string
  ): Promise<void> {
    if (!projectId || projectId.trim() === "") {
      throw new BadRequestException(
        "Project ID is required when deleting a phase"
      );
    }

    const project = await this.projectsRepository.findOne({
      where: { id: projectId },
    });
    if (!project) throw new NotFoundException("Project not found");

    const user = await this.usersService.findOne(userId);
    const isContractor = user?.role === "contractor";
    const isSubContractor = user?.role === "sub_contractor";
    const isAdmin = user?.role === "consultant";
    const isConsultant = user?.role === "consultant";
    const isOwner = project.owner_id === userId;

    if (
      !isOwner &&
      !isContractor &&
      !isSubContractor &&
      !isAdmin &&
      !isConsultant
    ) {
      throw new ForbiddenException(
        "Only the project owner, contractor, sub_contractor, admin, or consultant can delete a phase"
      );
    }

    const phase = await this.phasesRepository.findOne({
      where: { id: phaseId, project_id: projectId },
    });
    if (!phase) {
      throw new NotFoundException("Phase not found");
    }
    await this.phasesRepository.remove(phase);
    await this.activitiesService.createActivity(
      ActivityType.TASK_DELETED,
      `Phase "${phase.title}" was deleted`,
      user,
      project,
      phase,
      { phaseId: phase.id }
    );
  }

  async getProjectPhasesPaginated(
    projectId: string,
    userId: string,
    { page = 1, limit = 10 }: { page?: number; limit?: number }
  ) {
    const user = await this.usersService.findOne(userId);
    const isContractor = user?.role === "contractor";
    const isSubContractor = user?.role === "sub_contractor";
    const userRole = user?.role?.toLowerCase();

    if (!isContractor && !isSubContractor) {
      await this.projectsService.findOne(projectId, userId);
    } else {
      const project = await this.projectsRepository.findOne({
        where: { id: projectId },
      });
      if (!project) {
        throw new NotFoundException(`Project with ID ${projectId} not found`);
      }
    }

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    // Get all phases first (with role-based filtering)
    let allPhases: Phase[] = [];
    
    if (userRole === 'contractor') {
      // Contractors see their phases + linked sub-contractor phases
      const contractorPhases = await this.phasesRepository.find({
        where: { project_id: projectId, is_active: true, boqType: 'contractor' },
        relations: ["subPhases", "subPhases.subPhases", "linkedSubContractorPhases"],
        order: { created_at: "ASC" },
      });

      const contractorPhaseIds = contractorPhases.map(p => p.id);
      const linkedSubContractorPhases = contractorPhaseIds.length > 0
        ? await this.phasesRepository.find({
            where: { 
              project_id: projectId, 
              is_active: true,
              boqType: 'sub_contractor',
              linkedContractorPhaseId: In(contractorPhaseIds),
            },
            relations: ["subPhases", "subPhases.subPhases", "linkedContractorPhase"],
            order: { created_at: "ASC" },
          })
        : [];

      allPhases = [...contractorPhases, ...linkedSubContractorPhases].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    } else if (userRole === 'sub_contractor') {
      // Sub-contractors see their phases + linked contractor phases
      const subContractorPhases = await this.phasesRepository.find({
        where: { project_id: projectId, is_active: true, boqType: 'sub_contractor' },
        relations: ["subPhases", "subPhases.subPhases", "linkedContractorPhase"],
      order: { created_at: "ASC" },
      });

      const linkedContractorPhaseIds = subContractorPhases
        .map(p => p.linkedContractorPhaseId)
        .filter(id => id !== null);

      const linkedContractorPhases = linkedContractorPhaseIds.length > 0
        ? await this.phasesRepository.find({
            where: { 
              project_id: projectId, 
              is_active: true,
              boqType: 'contractor',
              id: In(linkedContractorPhaseIds),
            },
            relations: ["subPhases", "subPhases.subPhases", "linkedSubContractorPhases"],
            order: { created_at: "ASC" },
          })
        : [];

      allPhases = [...subContractorPhases, ...linkedContractorPhases].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    } else {
      // Consultants and other roles see all phases
      allPhases = await this.phasesRepository.find({
        where: { project_id: projectId, is_active: true },
        relations: ["subPhases", "subPhases.subPhases", "linkedContractorPhase", "linkedSubContractorPhases"],
        order: { created_at: "ASC" },
      });
    }

    // Apply pagination
    const total = allPhases.length;
    const paginatedItems = allPhases.slice(
      (pageNum - 1) * limitNum,
      pageNum * limitNum
    );

    return {
      items: paginatedItems,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  async getBoqDraftPhases(
    projectId: string,
    userId: string
  ): Promise<any[]> {
    await this.projectsService.findOne(projectId, userId);
    
    // Get user to determine role-based filtering
    const user = await this.usersService.findOne(userId);
    const userRole = user?.role?.toLowerCase();
    
    // Query the new separate tables based on user role
    if (userRole === 'contractor') {
      // Contractors see only contractor BOQ phases from contractor_phases table
      const contractorPhases = await this.contractorPhasesRepository.find({
        where: { 
          project_id: projectId, 
          from_boq: true, 
          is_active: false 
        },
        relations: ["subPhases"],
        order: { created_at: "ASC" },
      });
      
      // Also check legacy Phase table for backward compatibility
      const legacyPhases = await this.phasesRepository
        .createQueryBuilder('phase')
        .where('phase.project_id = :projectId', { projectId })
        .andWhere('phase.from_boq = :fromBoq', { fromBoq: true })
        .andWhere('phase.is_active = :isActive', { isActive: false })
        .andWhere('(phase.boqType = :contractorType OR phase.boqType IS NULL)', { contractorType: 'contractor' })
        .orderBy('phase.created_at', 'ASC')
        .getMany();
      
      // Combine and return (contractor phases take precedence)
      return [...contractorPhases, ...legacyPhases];
    } else if (userRole === 'sub_contractor') {
      // Sub-contractors see only sub-contractor BOQ phases from sub_contractor_phases table
      const subContractorPhases = await this.subContractorPhasesRepository.find({
        where: { 
          project_id: projectId, 
          from_boq: true, 
          is_active: false 
        },
        relations: ["subPhases"],
        order: { created_at: "ASC" },
      });
      
      // Also check legacy Phase table for backward compatibility
      const legacyPhases = await this.phasesRepository.find({
        where: { 
          project_id: projectId, 
          from_boq: true, 
          is_active: false,
          boqType: 'sub_contractor'
        },
        order: { created_at: "ASC" },
      });
      
      return [...subContractorPhases, ...legacyPhases];
    }
    
    // Consultants and other roles see all BOQ phases from both tables
    const contractorPhases = await this.contractorPhasesRepository.find({
      where: { 
        project_id: projectId, 
        from_boq: true, 
        is_active: false 
      },
      relations: ["subPhases"],
      order: { created_at: "ASC" },
    });
    
    const subContractorPhases = await this.subContractorPhasesRepository.find({
      where: { 
        project_id: projectId, 
        from_boq: true, 
        is_active: false 
      },
      relations: ["subPhases"],
      order: { created_at: "ASC" },
    });
    
    // Also get legacy phases
    const legacyPhases = await this.phasesRepository.find({
      where: { 
        project_id: projectId, 
        from_boq: true, 
        is_active: false 
      },
      order: { created_at: "ASC" },
    });
    
    return [...contractorPhases, ...subContractorPhases, ...legacyPhases];
  }

  async activateBoqPhases(
    projectId: string,
    phaseIds: string[],
    userId: string,
    linkedContractorPhaseId?: string
  ): Promise<{ activated: number; phases: any[] }> {
    const project = await this.projectsService.findOne(projectId, userId);

    if (!phaseIds || phaseIds.length === 0) {
      throw new BadRequestException("No phase IDs provided");
    }

    // Use QueryRunner for transaction management
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const activatedPhases: any[] = [];

    for (const phaseId of phaseIds) {
        // Try to find in contractor phases table first
        const contractorPhase = await queryRunner.manager.findOne(ContractorPhase, {
          where: {
            id: phaseId,
            project_id: projectId,
            from_boq: true,
          },
        });

        if (contractorPhase) {
          contractorPhase.is_active = true;
          await queryRunner.manager.save(ContractorPhase, contractorPhase);
          activatedPhases.push(contractorPhase);
          continue;
        }

        // Try to find in sub-contractor phases table
        const subContractorPhase = await queryRunner.manager.findOne(SubContractorPhase, {
        where: {
          id: phaseId,
          project_id: projectId,
          from_boq: true,
        },
      });

        if (subContractorPhase) {
          subContractorPhase.is_active = true;
          // If linking to a contractor phase, set the link
          if (linkedContractorPhaseId) {
            subContractorPhase.linkedContractorPhaseId = linkedContractorPhaseId;
          }
          await queryRunner.manager.save(SubContractorPhase, subContractorPhase);
          activatedPhases.push(subContractorPhase);
        continue;
      }

        // Try legacy Phase table for backward compatibility
        const legacyPhase = await queryRunner.manager.findOne(Phase, {
          where: {
            id: phaseId,
            project_id: projectId,
            from_boq: true,
          },
        });

        if (legacyPhase) {
          legacyPhase.is_active = true;
          await queryRunner.manager.save(Phase, legacyPhase);
          activatedPhases.push(legacyPhase);
        }
      }

      await queryRunner.commitTransaction();

      // Log activities outside transaction (activity logging failures shouldn't rollback critical operations)
    try {
      const user = await this.usersService.findOne(userId);
        // Count active phases from all tables
        const contractorCount = await this.contractorPhasesRepository.count({
          where: { project_id: projectId, is_active: true },
        });
        const subContractorCount = await this.subContractorPhasesRepository.count({
          where: { project_id: projectId, is_active: true },
        });
        const legacyCount = await this.phasesRepository.count({
        where: { project_id: projectId, is_active: true },
      });
        const totalPhases = contractorCount + subContractorCount + legacyCount;

      for (let i = 0; i < activatedPhases.length; i++) {
        const phase = activatedPhases[i];
        try {
          await this.activitiesService.logPhaseCreated(
            user,
            project,
            phase,
            totalPhases - activatedPhases.length + i + 1,
            totalPhases
          );
        } catch (err) {
          // Ignore activity logging errors
        }
      }
    } catch (error) {
      // Ignore activity logging errors
    }

    return {
      activated: activatedPhases.length,
      phases: activatedPhases,
    };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async createPhasesFromBoqData(
    data: any[],
    projectId: string,
    userId: string,
    boqType?: 'contractor' | 'sub_contractor'
  ): Promise<ContractorPhase[] | SubContractorPhase[]> {
    const project = await this.projectsRepository.findOne({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    const projectStartDate = project.start_date
      ? new Date(project.start_date)
      : new Date();
    const projectEndDate = project.end_date
      ? new Date(project.end_date)
      : new Date();

    // Use QueryRunner for transaction management
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (boqType === 'sub_contractor') {
        // Create sub-contractor phases
        const subContractorPhases: SubContractorPhase[] = [];

    for (const row of data) {
        // Extract description - check multiple possible field names including extracted fields
        const description = 
          row._extractedDescription ||
          row.Description || 
          row.description || 
          (row.rawData && (row.rawData.description || row.rawData.Description)) ||
          "";
        
        // Extract unit - check multiple possible field names
        const unit = 
          row._extractedUnit ||
          row.Unit || 
          row.unit || 
          (row.rawData && (row.rawData.unit || row.rawData.Unit)) ||
          "";
        
        // Extract quantity - check multiple possible field names
      const quantity =
          row._extractedQuantity !== undefined ? row._extractedQuantity :
          row.Quantity !== undefined ? parseFloat(String(row.Quantity)) :
          row.quantity !== undefined ? parseFloat(String(row.quantity)) :
          row.rawData && row.rawData.quantity !== undefined ? parseFloat(String(row.rawData.quantity)) :
          row.rawData && row.rawData.Quantity !== undefined ? parseFloat(String(row.rawData.Quantity)) :
          0;
        
        // Extract price/rate
        const price = 
          row.Price !== undefined ? parseFloat(String(row.Price)) :
          row.price !== undefined ? parseFloat(String(row.price)) :
          row.rate !== undefined ? parseFloat(String(row.rate)) :
          row.Rate !== undefined ? parseFloat(String(row.Rate)) :
          row.rawData && row.rawData.price !== undefined ? parseFloat(String(row.rawData.price)) :
          row.rawData && row.rawData.Price !== undefined ? parseFloat(String(row.rawData.Price)) :
          0;
        
        // Extract total price/amount - prioritize extracted amount from BOQ parser
      const totalPrice =
          row._extractedAmount !== undefined && row._extractedAmount !== null ? parseFloat(String(row._extractedAmount)) :
          row.amount !== undefined && row.amount !== null ? parseFloat(String(row.amount)) :
          row["Total Price"] !== undefined ? parseFloat(String(row["Total Price"])) :
          row.totalPrice !== undefined ? parseFloat(String(row.totalPrice)) :
          row.Amount !== undefined ? parseFloat(String(row.Amount)) :
          row.rawData && row.rawData.amount !== undefined ? parseFloat(String(row.rawData.amount)) :
          row.rawData && row.rawData["Total Price"] !== undefined ? parseFloat(String(row.rawData["Total Price"])) :
          // Fallback: calculate from quantity * rate if amount not found
          (quantity > 0 && price > 0) ? quantity * price : 0;

        // Extract section information
        const section = 
          row.section ||
          row.Section ||
          row._extractedSection ||
          (row.rawData && (row.rawData.section || row.rawData.Section)) ||
          "";

        // Build description with section, unit, and quantity (format expected by frontend)
        const descriptionParts: string[] = [];
        if (section) {
          descriptionParts.push(`Section: ${section}`);
        }
        if (unit) {
          descriptionParts.push(`Unit: ${unit}`);
        }
        if (quantity) {
          descriptionParts.push(`Quantity: ${quantity}`);
        }
        const phaseDescription = descriptionParts.length > 0 
          ? descriptionParts.join(" | ")
          : `Unit: ${unit}, Quantity: ${quantity}`;

      const phaseData = {
          title: description.trim() || "Untitled Phase",
        description: phaseDescription,
        budget: totalPrice || quantity * price,
        project_id: projectId,
        from_boq: true,
        is_active: false,
        status: PhaseStatus.NOT_STARTED,
        start_date: projectStartDate,
        end_date: projectEndDate,
          project: project,
        };

          const phase = queryRunner.manager.create(SubContractorPhase, phaseData);
          const savedPhase = await queryRunner.manager.save(SubContractorPhase, phase);
          subContractorPhases.push(savedPhase);
        }

        await queryRunner.commitTransaction();
        return subContractorPhases;
      } else {
        // Create contractor phases (default)
        const contractorPhases: ContractorPhase[] = [];
        
        for (const row of data) {
        // Extract description - check multiple possible field names including extracted fields
        const description = 
          row._extractedDescription ||
          row.Description || 
          row.description || 
          (row.rawData && (row.rawData.description || row.rawData.Description)) ||
          "";
        
        // Extract unit - check multiple possible field names
        const unit = 
          row._extractedUnit ||
          row.Unit || 
          row.unit || 
          (row.rawData && (row.rawData.unit || row.rawData.Unit)) ||
          "";
        
        // Extract quantity - check multiple possible field names
        const quantity = 
          row._extractedQuantity !== undefined ? row._extractedQuantity :
          row.Quantity !== undefined ? parseFloat(String(row.Quantity)) :
          row.quantity !== undefined ? parseFloat(String(row.quantity)) :
          row.rawData && row.rawData.quantity !== undefined ? parseFloat(String(row.rawData.quantity)) :
          row.rawData && row.rawData.Quantity !== undefined ? parseFloat(String(row.rawData.Quantity)) :
          0;
        
        // Extract price/rate - prioritize extracted rate from BOQ parser
        const price = 
          row._extractedRate !== undefined && row._extractedRate !== null ? parseFloat(String(row._extractedRate)) :
          row.rate !== undefined && row.rate !== null ? parseFloat(String(row.rate)) :
          row.Rate !== undefined ? parseFloat(String(row.Rate)) :
          row.Price !== undefined ? parseFloat(String(row.Price)) :
          row.price !== undefined ? parseFloat(String(row.price)) :
          row.rawData && row.rawData.rate !== undefined ? parseFloat(String(row.rawData.rate)) :
          row.rawData && row.rawData.price !== undefined ? parseFloat(String(row.rawData.price)) :
          row.rawData && row.rawData.Price !== undefined ? parseFloat(String(row.rawData.Price)) :
          0;
        
        // Extract total price/amount - prioritize extracted amount from BOQ parser
        const totalPrice = 
          row._extractedAmount !== undefined && row._extractedAmount !== null ? parseFloat(String(row._extractedAmount)) :
          row.amount !== undefined && row.amount !== null ? parseFloat(String(row.amount)) :
          row["Total Price"] !== undefined ? parseFloat(String(row["Total Price"])) :
          row.totalPrice !== undefined ? parseFloat(String(row.totalPrice)) :
          row.Amount !== undefined ? parseFloat(String(row.Amount)) :
          row.rawData && row.rawData.amount !== undefined ? parseFloat(String(row.rawData.amount)) :
          row.rawData && row.rawData["Total Price"] !== undefined ? parseFloat(String(row.rawData["Total Price"])) :
          // Fallback: calculate from quantity * rate if amount not found
          (quantity > 0 && price > 0) ? quantity * price : 0;

        // Extract section information
        const section = 
          row.section ||
          row.Section ||
          row._extractedSection ||
          (row.rawData && (row.rawData.section || row.rawData.Section)) ||
          "";

        // Build description with section, unit, and quantity (format expected by frontend)
        const descriptionParts: string[] = [];
        if (section) {
          descriptionParts.push(`Section: ${section}`);
        }
        if (unit) {
          descriptionParts.push(`Unit: ${unit}`);
        }
        if (quantity) {
          descriptionParts.push(`Quantity: ${quantity}`);
        }
        const phaseDescription = descriptionParts.length > 0 
          ? descriptionParts.join(" | ")
          : `Unit: ${unit}, Quantity: ${quantity}`;

        const phaseData = {
          title: description.trim() || "Untitled Phase",
          description: phaseDescription,
          budget: totalPrice || quantity * price,
          project_id: projectId,
          from_boq: true,
          is_active: false,
          status: PhaseStatus.NOT_STARTED,
          start_date: projectStartDate,
          end_date: projectEndDate,
        project: project,
        };

          const phase = queryRunner.manager.create(ContractorPhase, phaseData);
          const savedPhase = await queryRunner.manager.save(ContractorPhase, phase);
          contractorPhases.push(savedPhase);
        }

        await queryRunner.commitTransaction();
        return contractorPhases;
      }
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}


