import { CreateTaskDto } from "../../tasks/dto/create-task.dto";
import { CreateSubPhaseDto } from "./create-sub-phase.dto";
import { PhaseStatus } from "../../entities/phase.entity";
export declare class CreatePhaseDto {
    title?: string;
    description?: string;
    deliverables?: string;
    requirements?: string;
    startDate?: string;
    endDate?: string;
    dueDate?: string;
    budget?: number;
    progress?: number;
    status?: PhaseStatus;
    parentPhaseId?: string;
    referenceTaskId?: string;
    tasks?: CreateTaskDto[];
    subPhases?: CreateSubPhaseDto[];
}
