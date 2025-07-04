import { SubPhasesService } from "./subphases.service";
import { SubPhase } from "../entities/sub-phase.entity";
import { RequestWithUser } from "../auth/interfaces/request-with-user.interface";
export declare class SubPhasesController {
    private readonly subPhasesService;
    constructor(subPhasesService: SubPhasesService);
    updateSubPhase(id: string, isCompleted: boolean, req: RequestWithUser): Promise<SubPhase>;
}
