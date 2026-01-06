import { User } from "./user.entity";
import { Project } from "./project.entity";
import { Phase } from "./phase.entity";
import { SubPhase } from "./sub-phase.entity";
export declare enum ComplaintStatus {
    OPEN = "open",
    RESOLVED = "resolved",
    APPEALED = "appealed"
}
export declare class Complaint {
    id: string;
    project_id: string;
    phase_id: string;
    sub_phase_id: string;
    raised_by: string;
    title: string;
    description: string;
    status: ComplaintStatus;
    response: string;
    responded_by: string;
    responded_at: Date;
    appeal_reason: string;
    appealed_at: Date;
    created_at: Date;
    updated_at: Date;
    raiser: User;
    project: Project;
    phase: Phase;
    subPhase: SubPhase;
    responder: User;
}
