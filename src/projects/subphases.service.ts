import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SubPhase } from "../entities/sub-phase.entity";
import { ActivitiesService } from "../activities/activities.service";
import { Phase } from "../entities/phase.entity";
import { Project } from "../entities/project.entity";
import { User } from "../entities/user.entity";
import { ActivityType } from "../entities/activity.entity";

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
    private readonly activitiesService: ActivitiesService
  ) {}

  async update(
    id: string,
    update: Partial<SubPhase>,
    user?: User
  ): Promise<SubPhase> {
    const subPhase = await this.subPhaseRepository.findOne({
      where: { id },
      relations: ["phase"],
    });
    if (!subPhase) throw new NotFoundException("SubPhase not found");
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
}
