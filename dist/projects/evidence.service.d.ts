import { Repository } from "typeorm";
import { PhaseEvidence, EvidenceType } from "../entities/phase-evidence.entity";
import { Phase } from "../entities/phase.entity";
import { SubPhase } from "../entities/sub-phase.entity";
import { User } from "../entities/user.entity";
export declare class EvidenceService {
    private evidenceRepository;
    private phaseRepository;
    private subPhaseRepository;
    constructor(evidenceRepository: Repository<PhaseEvidence>, phaseRepository: Repository<Phase>, subPhaseRepository: Repository<SubPhase>);
    uploadEvidence(phaseId: string, file: Express.Multer.File | undefined, type: EvidenceType, notes: string | undefined, subPhaseId: string | undefined, user: User): Promise<PhaseEvidence>;
    findByPhase(phaseId: string): Promise<PhaseEvidence[]>;
    findBySubPhase(subPhaseId: string): Promise<PhaseEvidence[]>;
}
