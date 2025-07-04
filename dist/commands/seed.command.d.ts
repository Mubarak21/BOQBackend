import { Repository } from "typeorm";
import { User } from "../entities/user.entity";
import { Department } from "../entities/department.entity";
export declare class SeedService {
    private readonly userRepository;
    private readonly departmentRepository;
    constructor(userRepository: Repository<User>, departmentRepository: Repository<Department>);
    seed(): Promise<void>;
}
export declare class SeedCommand {
    private readonly seedService;
    constructor(seedService: SeedService);
    run(): Promise<void>;
}
