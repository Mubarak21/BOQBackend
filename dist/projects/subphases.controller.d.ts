import { SubPhasesService } from "./subphases.service";
import { SubPhase } from "../entities/sub-phase.entity";
import { RequestWithUser } from "../auth/interfaces/request-with-user.interface";
import { CreateSubPhaseDto } from "./dto/create-sub-phase.dto";
export declare class SubPhasesController {
    private readonly subPhasesService;
    constructor(subPhasesService: SubPhasesService);
    createSubPhase(phaseId: string, createDto: CreateSubPhaseDto, req: RequestWithUser): Promise<SubPhase>;
    createNestedSubPhase(parentSubPhaseId: string, createDto: CreateSubPhaseDto, req: RequestWithUser): Promise<SubPhase>;
    updateSubPhase(id: string, isCompleted: boolean, req: RequestWithUser): Promise<SubPhase>;
    searchSubPhases(projectId: string, search: string, req: RequestWithUser): Promise<{
        subPhase: SubPhase;
        phase: import("../entities/phase.entity").Phase;
    }[]>;
}
