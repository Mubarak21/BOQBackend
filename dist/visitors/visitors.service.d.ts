import { Repository } from "typeorm";
import { Visitor } from "../entities/visitor.entity";
import { Project } from "../entities/project.entity";
import { User } from "../entities/user.entity";
import { CreateVisitorDto } from "./dto/create-visitor.dto";
import { UpdateVisitorDto } from "./dto/update-visitor.dto";
export declare class VisitorsService {
    private visitorRepository;
    private projectsRepository;
    constructor(visitorRepository: Repository<Visitor>, projectsRepository: Repository<Project>);
    private hasProjectAccess;
    private isConsultant;
    private isContractorOrSubContractor;
    private canAddVisitor;
    create(projectId: string, dto: CreateVisitorDto, user: User): Promise<Visitor>;
    findByProject(projectId: string, user: User): Promise<Visitor[]>;
    findOne(id: string, user: User): Promise<Visitor>;
    update(id: string, dto: UpdateVisitorDto, user: User): Promise<Visitor>;
    remove(id: string, user: User): Promise<void>;
}
