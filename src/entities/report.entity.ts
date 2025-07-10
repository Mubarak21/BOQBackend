import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

export enum ReportStatus {
  PROCESSING = "processing",
  READY = "ready",
  FAILED = "failed",
}

@Entity("reports")
export class Report {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  type: string;

  @Column({ nullable: true })
  parameters: string; // JSON string of parameters used to generate the report

  @Column({
    type: "enum",
    enum: ReportStatus,
    default: ReportStatus.PROCESSING,
  })
  status: ReportStatus;

  @Column({ nullable: true })
  filePath: string;

  @Column({ nullable: true })
  fileName: string;

  @Column({ nullable: true })
  fileMimeType: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
