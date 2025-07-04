import { Repository } from "typeorm";
import { SubPhase } from "../entities/sub-phase.entity";
import { ActivitiesService } from "../activities/activities.service";
import { Phase } from "../entities/phase.entity";
import { Project } from "../entities/project.entity";
import { User } from "../entities/user.entity";
export declare class SubPhasesService {
    private readonly subPhaseRepository;
    private readonly phaseRepository;
    private readonly projectRepository;
    private readonly activitiesService;
    constructor(subPhaseRepository: Repository<SubPhase>, phaseRepository: Repository<Phase>, projectRepository: Repository<Project>, activitiesService: ActivitiesService);
    update(id: string, update: Partial<SubPhase>, user?: User): Promise<SubPhase>;
}
