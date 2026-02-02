import { User } from "./user.entity";
import { Project } from "./project.entity";
export declare class DailyAttendance {
    id: string;
    project_id: string;
    project: Project;
    recorded_by: string;
    recordedByUser: User;
    attendance_date: string;
    workers_present: number;
    notes: string | null;
    created_at: Date;
    updated_at: Date;
}
