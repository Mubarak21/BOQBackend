import { User } from "./user.entity";
import { Project } from "./project.entity";
export declare class Department {
    id: string;
    name: string;
    users: User[];
    projects: Project[];
}
