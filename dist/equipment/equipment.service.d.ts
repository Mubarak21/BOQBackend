import { Repository } from "typeorm";
import { Equipment } from "../entities/equipment.entity";
import { Project } from "../entities/project.entity";
import { User } from "../entities/user.entity";
import { CreateEquipmentDto } from "./dto/create-equipment.dto";
import { UpdateEquipmentDto } from "./dto/update-equipment.dto";
export declare class EquipmentService {
    private equipmentRepository;
    private projectsRepository;
    constructor(equipmentRepository: Repository<Equipment>, projectsRepository: Repository<Project>);
    private hasProjectAccess;
    private isConsultant;
    getProjectsWithEquipmentCount(user: User): Promise<{
        id: string;
        title: string;
        equipmentCount: number;
    }[]>;
    findByProject(projectId: string, user: User): Promise<Equipment[]>;
    create(projectId: string, dto: CreateEquipmentDto, user: User): Promise<Equipment>;
    findOne(id: string, user: User): Promise<Equipment>;
    update(id: string, dto: UpdateEquipmentDto, user: User): Promise<Equipment>;
    remove(id: string, user: User): Promise<void>;
}
