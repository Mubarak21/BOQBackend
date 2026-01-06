import {
  IsOptional,
  IsString,
  IsEnum,
  IsBoolean,
  IsNumber,
  Min,
  Max,
} from "class-validator";
import { Type, Transform } from "class-transformer";
import { InventoryCategory } from "../../entities/inventory.entity";

export class InventoryQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(InventoryCategory)
  category?: InventoryCategory;

  @IsOptional()
  @IsString()
  supplier?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  is_active?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  low_stock?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  sortBy?: string = "name";

  @IsOptional()
  @IsString()
  sortOrder?: "ASC" | "DESC" = "ASC";
}
