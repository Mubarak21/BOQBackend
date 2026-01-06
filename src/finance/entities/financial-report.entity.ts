import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "../../entities/user.entity";

export enum ReportType {
  SUMMARY = "summary",
  DETAILED = "detailed",
  TRANSACTIONS = "transactions",
  SAVINGS = "savings",
}

export enum FileFormat {
  PDF = "pdf",
  EXCEL = "excel",
  CSV = "csv",
  WORD = "word",
}

export enum GenerationStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
}

@Entity("financial_reports")
export class FinancialReport {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 255, name: "report_name" })
  reportName: string;

  @Column({
    type: "enum",
    enum: ReportType,
    name: "report_type",
  })
  reportType: ReportType;

  @Column({
    type: "enum",
    enum: FileFormat,
    name: "file_format",
  })
  fileFormat: FileFormat;

  @Column({ length: 500, nullable: true, name: "file_path" })
  filePath: string;

  @Column({ type: "bigint", nullable: true, name: "file_size" })
  fileSize: number;

  @Column({ type: "date", nullable: true, name: "date_range_from" })
  dateRangeFrom: Date;

  @Column({ type: "date", nullable: true, name: "date_range_to" })
  dateRangeTo: Date;

  @Column({ type: "uuid", array: true, nullable: true, name: "project_ids" })
  projectIds: string[];

  @Column({ type: "jsonb", nullable: true })
  parameters: any;

  @Column({
    type: "enum",
    enum: GenerationStatus,
    default: GenerationStatus.PENDING,
    name: "generation_status",
  })
  generationStatus: GenerationStatus;

  @Column({ type: "timestamp", nullable: true, name: "generated_at" })
  generatedAt: Date;

  @Column({ name: "generated_by" })
  generatedBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "generated_by" })
  generator: User;

  @Column({ type: "int", default: 0, name: "download_count" })
  downloadCount: number;

  @Column({ type: "timestamp", nullable: true, name: "expires_at" })
  expiresAt: Date;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  get isExpired(): boolean {
    return this.expiresAt && this.expiresAt < new Date();
  }

  get isReady(): boolean {
    return (
      this.generationStatus === GenerationStatus.COMPLETED && !this.isExpired
    );
  }

  get fileSizeFormatted(): string {
    if (!this.fileSize) return "Unknown";

    const bytes = this.fileSize;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));

    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  }
}
