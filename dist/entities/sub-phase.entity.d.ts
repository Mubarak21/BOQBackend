import { Phase } from "./phase.entity";
export declare class SubPhase {
    id: string;
    title: string;
    description?: string;
    isCompleted: boolean;
    phase: Phase;
    phase_id: string;
}
