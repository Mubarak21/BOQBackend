import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { EquipmentCategory, EquipmentStatus } from "../../entities/equipment.entity";

export class CreateEquipmentDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  quantity?: number;

  @IsOptional()
  @IsEnum(EquipmentCategory)
  category?: EquipmentCategory;

  @IsOptional()
  @IsEnum(EquipmentStatus)
  status?: EquipmentStatus;

  @IsOptional()
  @IsString()
  serial_number?: string;
}
