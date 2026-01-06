import { Repository } from "typeorm";
import { SubPhase } from "../entities/sub-phase.entity";
import { ActivitiesService } from "../activities/activities.service";
import { Phase } from "../entities/phase.entity";
import { Project } from "../entities/project.entity";
import { User } from "../entities/user.entity";
import { UsersService } from "../users/users.service";
export declare class SubPhasesService {
    private readonly subPhaseRepository;
    private readonly phaseRepository;
    private readonly projectRepository;
    private readonly activitiesService;
    private readonly usersService;
    constructor(subPhaseRepository: Repository<SubPhase>, phaseRepository: Repository<Phase>, projectRepository: Repository<Project>, activitiesService: ActivitiesService, usersService: UsersService);
    create(phaseId: string, createDto: {
        title: string;
        description?: string;
        parentSubPhaseId?: string;
    }, user?: User): Promise<SubPhase>;
    update(id: string, update: Partial<SubPhase>, user?: User): Promise<SubPhase>;
    findOne(id: string): Promise<SubPhase | null>;
    searchSubPhases(projectId: string, search: string): Promise<Array<{
        subPhase: SubPhase;
        phase: Phase;
    }>>;
    private hasIncompleteNestedSubPhases;
    private checkNestedSubPhasesRecursive;
}
