import { ComplaintsService } from "./complaints.service";
import { CreateComplaintDto } from "./dto/create-complaint.dto";
import { RespondComplaintDto } from "./dto/respond-complaint.dto";
import { AppealComplaintDto } from "./dto/appeal-complaint.dto";
export declare class ComplaintsController {
    private readonly complaintsService;
    constructor(complaintsService: ComplaintsService);
    create(createComplaintDto: CreateComplaintDto, req: any): Promise<import("../entities/complaint.entity").Complaint>;
    findByProject(projectId: string): Promise<any[]>;
    findOne(id: string): Promise<import("../entities/complaint.entity").Complaint>;
    respond(id: string, respondDto: RespondComplaintDto, req: any): Promise<import("../entities/complaint.entity").Complaint>;
    appeal(id: string, appealDto: AppealComplaintDto, req: any): Promise<import("../entities/complaint.entity").Complaint>;
}
