import { VisitorsService } from "./visitors.service";
import { CreateVisitorDto } from "./dto/create-visitor.dto";
import { UpdateVisitorDto } from "./dto/update-visitor.dto";
import { RequestWithUser } from "../auth/interfaces/request-with-user.interface";
export declare class VisitorsController {
    private readonly visitorsService;
    constructor(visitorsService: VisitorsService);
    create(projectId: string, dto: CreateVisitorDto, req: RequestWithUser): Promise<import("../entities/visitor.entity").Visitor>;
    findByProject(projectId: string, req: RequestWithUser): Promise<import("../entities/visitor.entity").Visitor[]>;
    findOne(id: string, req: RequestWithUser): Promise<import("../entities/visitor.entity").Visitor>;
    update(id: string, dto: UpdateVisitorDto, req: RequestWithUser): Promise<import("../entities/visitor.entity").Visitor>;
    remove(id: string, req: RequestWithUser): Promise<{
        message: string;
    }>;
}
