import { Project } from "./project.entity";
import { Task } from "./task.entity";
import { SubPhase } from "./sub-phase.entity";
import { PhaseFinancialSummary } from "./phase-financial-summary.entity";
import { PhaseStatus } from "./phase.entity";
export declare class ContractorPhase {
    id: string;
    title: string;
    description: string;
    start_date: Date;
    end_date: Date;
    budget: number;
    progress: number;
    status: PhaseStatus;
    project: Project;
    project_id: string;
    tasks: Task[];
    created_at: Date;
    updated_at: Date;
    deliverables: string;
    requirements: string;
    due_date: Date;
    reference_task_id: string;
    is_active: boolean;
    from_boq: boolean;
    subPhases: SubPhase[];
    linkedSubContractorPhases: any[];
    financialSummary: PhaseFinancialSummary;
}
