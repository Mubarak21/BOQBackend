import { ReportType, ReportStatus } from "../../../entities/report.entity";

export class ReportResponseDto {
  id: string;
  name: string;
  description?: string;
  type: ReportType;
  status: ReportStatus;
  progress: number;
  parameters?: any;

  // File information
  fileName?: string;
  fileMimeType?: string;
  fileSize?: number;

  // Date range
  dateFrom?: Date;
  dateTo?: Date;

  // User information
  generatedBy?: {
    id: string;
    display_name: string;
    email: string;
  };

  // Error information
  error?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  retentionDate?: Date;
}

export class ReportListResponseDto {
  items: ReportResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ReportDownloadResponseDto {
  message: string;
  downloadUrl?: string;
  fileName: string;
  fileSize: number;
  contentType: string;
}
