import { AccidentsService } from "./accidents.service";
import { CreateAccidentDto } from "./dto/create-accident.dto";
import { UpdateAccidentDto } from "./dto/update-accident.dto";
import { RequestWithUser } from "../auth/interfaces/request-with-user.interface";
export declare class AccidentsController {
    private readonly accidentsService;
    constructor(accidentsService: AccidentsService);
    create(projectId: string, dto: CreateAccidentDto, req: RequestWithUser): Promise<import("../entities/accident.entity").Accident>;
    findByProject(projectId: string, req: RequestWithUser): Promise<import("../entities/accident.entity").Accident[]>;
    findOne(id: string, req: RequestWithUser): Promise<import("../entities/accident.entity").Accident>;
    update(id: string, dto: UpdateAccidentDto, req: RequestWithUser): Promise<import("../entities/accident.entity").Accident>;
}
