import { Phase } from "./phase.entity";
import { Project } from "./project.entity";
export declare class PhaseSpending {
    id: string;
    phase_id: string;
    phase: Phase;
    project_id: string;
    project: Project;
    amount: number;
    description: string;
    date: Date;
    created_at: Date;
    updated_at: Date;
}
