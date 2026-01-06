import { User } from "./user.entity";
import { Phase } from "./phase.entity";
import { SubPhase } from "./sub-phase.entity";
export declare enum EvidenceType {
    PHOTO = "photo",
    VIDEO = "video",
    NOTE = "note",
    DOCUMENT = "document"
}
export declare class PhaseEvidence {
    id: string;
    phase_id: string;
    sub_phase_id: string;
    type: EvidenceType;
    file_url: string;
    notes: string;
    uploaded_by: string;
    created_at: Date;
    phase: Phase;
    subPhase: SubPhase;
    uploader: User;
}
