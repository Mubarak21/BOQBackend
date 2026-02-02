import { AccidentSeverity } from "../../entities/accident.entity";
export declare class CreateAccidentDto {
    accident_date: string;
    description: string;
    severity: AccidentSeverity;
    location?: string;
    injured_count?: number;
    action_taken?: string;
}
