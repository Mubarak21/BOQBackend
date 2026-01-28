import { Phase } from "./phase.entity";
import { ContractorPhase } from "./contractor-phase.entity";
import { SubContractorPhase } from "./sub-contractor-phase.entity";
export declare class SubPhase {
    id: string;
    title: string;
    description?: string;
    isCompleted: boolean;
    phase: Phase;
    phase_id: string;
    contractorPhaseId: string;
    contractorPhase: ContractorPhase;
    subContractorPhaseId: string;
    subContractorPhase: SubContractorPhase;
    parentSubPhase: SubPhase;
    parent_sub_phase_id: string;
    subPhases: SubPhase[];
}
