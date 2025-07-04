import { Repository } from "typeorm";
import { Department } from "../entities/department.entity";
import { Project } from "../entities/project.entity";
import { User } from "../entities/user.entity";
export declare class DepartmentsController {
    private readonly departmentRepository;
    private readonly projectRepository;
    private readonly userRepository;
    constructor(departmentRepository: Repository<Department>, projectRepository: Repository<Project>, userRepository: Repository<User>);
    getAllDepartments(): Promise<Department[]>;
    createDepartment(body: {
        name: string;
    }): Promise<Department>;
    updateDepartment(id: string, body: {
        name: string;
    }): Promise<Department>;
    deleteDepartment(id: string): Promise<import("typeorm").DeleteResult>;
    getProjectsForMyDepartment(req: any): Promise<Project[]>;
}
