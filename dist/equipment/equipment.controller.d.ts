import { EquipmentService } from "./equipment.service";
import { CreateEquipmentDto } from "./dto/create-equipment.dto";
import { UpdateEquipmentDto } from "./dto/update-equipment.dto";
import { RequestWithUser } from "../auth/interfaces/request-with-user.interface";
export declare class EquipmentController {
    private readonly equipmentService;
    constructor(equipmentService: EquipmentService);
    getProjectsWithEquipmentCount(req: RequestWithUser): Promise<{
        id: string;
        title: string;
        equipmentCount: number;
    }[]>;
    findByProject(projectId: string, req: RequestWithUser): Promise<import("../entities/equipment.entity").Equipment[]>;
    create(projectId: string, dto: CreateEquipmentDto, req: RequestWithUser): Promise<import("../entities/equipment.entity").Equipment>;
    findOne(id: string, req: RequestWithUser): Promise<import("../entities/equipment.entity").Equipment>;
    update(id: string, dto: UpdateEquipmentDto, req: RequestWithUser): Promise<import("../entities/equipment.entity").Equipment>;
    remove(id: string, req: RequestWithUser): Promise<void>;
}
