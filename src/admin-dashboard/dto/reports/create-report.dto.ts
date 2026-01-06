import {
  IsEnum,
  IsString,
  IsOptional,
  IsObject,
  IsDateString,
  IsNotEmpty,
} from "class-validator";
import { ReportType } from "../../../entities/report.entity";

export class CreateReportDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(ReportType)
  type: ReportType;

  @IsObject()
  @IsOptional()
  parameters?: {
    // Project-related parameters
    projectIds?: string[];
    projectStatus?: string[];

    // User-related parameters
    userIds?: string[];
    userRoles?: string[];

    // Activity-related parameters
    activityTypes?: string[];

    // Data source selection
    dataSources?: ("projects" | "users" | "activities" | "analytics")[];

    // Additional filters
    includeArchived?: boolean;
    includeDeleted?: boolean;

    // Report-specific options
    includeCharts?: boolean;
    includeDetails?: boolean;
    groupBy?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";

    // Export options
    includeHeaders?: boolean;
    includeMetadata?: boolean;
  };

  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @IsDateString()
  @IsOptional()
  dateTo?: string;
}
