import { PenaltiesService } from "./penalties.service";
import { CreatePenaltyDto } from "./dto/create-penalty.dto";
import { AppealPenaltyDto } from "./dto/appeal-penalty.dto";
export declare class PenaltiesController {
    private readonly penaltiesService;
    constructor(penaltiesService: PenaltiesService);
    create(createPenaltyDto: CreatePenaltyDto, req: any): Promise<import("../entities/penalty.entity").Penalty>;
    findByProject(projectId: string): Promise<any[]>;
    findOne(id: string): Promise<import("../entities/penalty.entity").Penalty>;
    appeal(id: string, appealDto: AppealPenaltyDto, req: any): Promise<import("../entities/penalty.entity").Penalty>;
    markAsPaid(id: string, req: any): Promise<import("../entities/penalty.entity").Penalty>;
}
