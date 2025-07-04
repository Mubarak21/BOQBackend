export declare class CreateTaskDto {
    description: string;
    unit?: string;
    quantity?: number;
    price?: number;
    project_id: string;
    phase_id?: string;
    id?: string;
    subTasks?: CreateTaskDto[];
}
