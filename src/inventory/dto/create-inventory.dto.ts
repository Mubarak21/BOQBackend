import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsArray,
  IsBoolean,
  Min,
  IsPositive,
  IsUUID,
} from "class-validator";
import { Type } from "class-transformer";
import { InventoryCategory } from "../../entities/inventory.entity";

export class CreateInventoryDto {
  @IsUUID()
  @IsOptional()
  project_id?: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  unit: string;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  unit_price: number;

  @IsEnum(InventoryCategory)
  @IsOptional()
  category?: InventoryCategory;

  @IsString()
  @IsOptional()
  brand?: string;

  @IsString()
  @IsOptional()
  model?: string;

  @IsString()
  @IsOptional()
  supplier?: string;

  @IsString()
  @IsOptional()
  supplier_contact?: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  quantity_available?: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  minimum_stock?: number;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsString()
  @IsOptional()
  barcode?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsString()
  @IsOptional()
  notes?: string;
}
