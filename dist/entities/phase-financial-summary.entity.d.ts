import { Phase } from "./phase.entity";
import { ContractorPhase } from "./contractor-phase.entity";
import { SubContractorPhase } from "./sub-contractor-phase.entity";
export declare class PhaseFinancialSummary {
    id: string;
    phase_id: string;
    phase: Phase;
    contractorPhaseId: string;
    contractorPhase: ContractorPhase;
    subContractorPhaseId: string;
    subContractorPhase: SubContractorPhase;
    allocatedBudget: number;
    spentAmount: number;
    estimatedCost: number;
    actualCost: number;
    variance: number;
    financialStatus: "on_track" | "warning" | "over_budget";
    lastUpdated: Date;
    createdAt: Date;
    updatedAt: Date;
}
