import { CreateTaskDto } from "../../tasks/dto/create-task.dto";
export declare class CreatePhaseDto {
    title?: string;
    description?: string;
    workDescription?: string;
    deliverables?: string;
    requirements?: string;
    risks?: string;
    dependencies?: string;
    priority?: string;
    startDate?: string;
    endDate?: string;
    dueDate?: string;
    estimatedHours?: number;
    budget?: number;
    spent?: number;
    progress?: number;
    status?: string;
    assigneeId?: string;
    parentPhaseId?: string;
    referenceTaskId?: string;
    tasks?: CreateTaskDto[];
}
