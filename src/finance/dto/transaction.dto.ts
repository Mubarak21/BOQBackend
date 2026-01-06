import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsDateString,
  IsUrl,
  Min,
} from "class-validator";
import { Transform, Type } from "class-transformer";
import { TransactionType } from "../entities/project-transaction.entity";

export class CreateTransactionDto {
  @IsString()
  projectId: string;

  @IsString()
  categoryId: string;

  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  amount: number;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  vendor?: string;

  @IsDateString()
  transactionDate: string;

  @IsOptional()
  @IsUrl()
  receiptUrl?: string;
}

export class TransactionQueryDto {
  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;
}

export class UpdateTransactionDto {
  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  amount?: number;

  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  vendor?: string;

  @IsOptional()
  @IsDateString()
  transactionDate?: string;

  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @IsOptional()
  @IsUrl()
  receiptUrl?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class TransactionListResponseDto {
  transactions: any[];
  total: number;
  page: number;
  limit: number;
}
