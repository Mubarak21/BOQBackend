import { Repository } from "typeorm";
import { Accident } from "../entities/accident.entity";
import { Project } from "../entities/project.entity";
import { User } from "../entities/user.entity";
import { CreateAccidentDto } from "./dto/create-accident.dto";
import { UpdateAccidentDto } from "./dto/update-accident.dto";
export declare class AccidentsService {
    private accidentRepository;
    private projectsRepository;
    constructor(accidentRepository: Repository<Accident>, projectsRepository: Repository<Project>);
    private hasProjectAccess;
    private isConsultant;
    private isContractorOrSubContractor;
    create(projectId: string, dto: CreateAccidentDto, user: User): Promise<Accident>;
    findByProject(projectId: string, user: User): Promise<Accident[]>;
    findOne(id: string, user: User): Promise<Accident>;
    update(id: string, dto: UpdateAccidentDto, user: User): Promise<Accident>;
}
