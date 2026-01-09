import { Repository } from "typeorm";
import { Penalty } from "../entities/penalty.entity";
import { User } from "../entities/user.entity";
import { Project } from "../entities/project.entity";
import { Complaint } from "../entities/complaint.entity";
import { CreatePenaltyDto } from "./dto/create-penalty.dto";
import { AppealPenaltyDto } from "./dto/appeal-penalty.dto";
export declare class PenaltiesService {
    private penaltiesRepository;
    private projectsRepository;
    private complaintsRepository;
    constructor(penaltiesRepository: Repository<Penalty>, projectsRepository: Repository<Project>, complaintsRepository: Repository<Complaint>);
    create(createPenaltyDto: CreatePenaltyDto, user: User, evidenceFile?: Express.Multer.File): Promise<Penalty>;
    findByProject(projectId: string): Promise<any[]>;
    findOne(id: string): Promise<Penalty>;
    appeal(id: string, appealDto: AppealPenaltyDto, user: User): Promise<Penalty>;
    markAsPaid(id: string, user: User): Promise<Penalty>;
}
