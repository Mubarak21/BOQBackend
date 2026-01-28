import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Project } from "./project.entity";
import { User } from "./user.entity";

export enum BOQType {
  CONTRACTOR = "contractor",
  SUB_CONTRACTOR = "sub_contractor",
}

export enum BOQStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  PROCESSED = "processed",
  FAILED = "failed",
}

@Entity("project_boqs")
export class ProjectBoq {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  project_id: string;

  @ManyToOne(() => Project, { onDelete: "CASCADE" })
  @JoinColumn({ name: "project_id" })
  project: Project;

  @Column({
    type: "enum",
    enum: BOQType,
  })
  type: BOQType;

  @Column({
    type: "enum",
    enum: BOQStatus,
    default: BOQStatus.PENDING,
  })
  status: BOQStatus;

  @Column({ nullable: true })
  file_name: string;

  @Column({ nullable: true })
  file_path: string;

  @Column({ nullable: true })
  file_mimetype: string;

  @Column({ type: "bigint", nullable: true })
  file_size: number;

  @Column({
    type: "decimal",
    precision: 20,
    scale: 2,
    nullable: true,
  })
  total_amount: number;

  @Column({ type: "int", nullable: true })
  phases_count: number;

  @Column({ nullable: true })
  uploaded_by: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "uploaded_by" })
  uploader: User;

  @Column({ type: "text", nullable: true })
  error_message: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
