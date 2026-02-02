import { EquipmentCategory, EquipmentStatus } from "../../entities/equipment.entity";
export declare class UpdateEquipmentDto {
    name?: string;
    description?: string;
    quantity?: number;
    category?: EquipmentCategory;
    status?: EquipmentStatus;
    serial_number?: string;
}
