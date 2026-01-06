import {
  IsString,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
} from "class-validator";
import { Type } from "class-transformer";

export class BudgetCategoryUpdateDto {
  @IsString()
  categoryId: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  budgetedAmount: number;
}

export class UpdateProjectBudgetDto {
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  totalBudget: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BudgetCategoryUpdateDto)
  categories: BudgetCategoryUpdateDto[];
}

export class BudgetAlertConfigDto {
  @IsString()
  projectId: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  warningThreshold: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  criticalThreshold: number;

  @IsNumber()
  @Type(() => Boolean)
  emailNotifications: boolean;
}
