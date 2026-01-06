import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./user.entity";

export enum ReportStatus {
  SCHEDULED = "scheduled",
  PROCESSING = "processing",
  READY = "ready",
  FAILED = "failed",
}

export enum ReportType {
  PDF = "PDF",
  XLSX = "XLSX",
  CSV = "CSV",
  JSON = "JSON",
}

@Entity("reports")
export class Report {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: "enum",
    enum: ReportType,
  })
  type: ReportType;

  @Column({ type: "json", nullable: true })
  parameters: any; // JSON object of parameters used to generate the report

  @Column({
    type: "enum",
    enum: ReportStatus,
    default: ReportStatus.SCHEDULED,
  })
  status: ReportStatus;

  @Column({ nullable: true })
  filePath: string;

  @Column({ nullable: true })
  fileName: string;

  @Column({ nullable: true })
  fileMimeType: string;

  @Column({ type: "bigint", nullable: true })
  fileSize: number;

  // User who generated the report
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "generated_by" })
  generatedBy: User;

  @Column({ nullable: true })
  generated_by: string;

  // Date range for the report data
  @Column({ type: "timestamp", nullable: true })
  dateFrom: Date;

  @Column({ type: "timestamp", nullable: true })
  dateTo: Date;

  // Error message if generation failed
  @Column({ type: "text", nullable: true })
  error: string;

  // When the report file should be deleted (for cleanup)
  @Column({ type: "timestamp", nullable: true })
  retentionDate: Date;

  // Processing progress (0-100)
  @Column({ type: "int", default: 0 })
  progress: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
