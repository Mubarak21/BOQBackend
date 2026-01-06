import { Repository } from "typeorm";
import { Complaint } from "../entities/complaint.entity";
import { User } from "../entities/user.entity";
import { Project } from "../entities/project.entity";
import { CreateComplaintDto } from "./dto/create-complaint.dto";
import { RespondComplaintDto } from "./dto/respond-complaint.dto";
import { AppealComplaintDto } from "./dto/appeal-complaint.dto";
export declare class ComplaintsService {
    private complaintsRepository;
    private projectsRepository;
    constructor(complaintsRepository: Repository<Complaint>, projectsRepository: Repository<Project>);
    create(createComplaintDto: CreateComplaintDto, user: User): Promise<Complaint>;
    findByProject(projectId: string): Promise<any[]>;
    findOne(id: string): Promise<Complaint>;
    respond(id: string, respondDto: RespondComplaintDto, user: User): Promise<Complaint>;
    appeal(id: string, appealDto: AppealComplaintDto, user: User): Promise<Complaint>;
}
