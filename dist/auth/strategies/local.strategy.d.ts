import { Repository } from "typeorm";
import { Admin } from "../../entities/admin.entity";
declare const LocalStrategy_base: new (...args: any[]) => any;
export declare class LocalStrategy extends LocalStrategy_base {
    private readonly adminRepository;
    constructor(adminRepository: Repository<Admin>);
    validate(email: string, password: string): Promise<any>;
}
export {};
