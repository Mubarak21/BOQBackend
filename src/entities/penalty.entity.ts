import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./user.entity";
import { Project } from "./project.entity";
import { Phase } from "./phase.entity";
import { Complaint } from "./complaint.entity";

export enum PenaltyStatus {
  PENDING = "pending",
  PAID = "paid",
  APPEALED = "appealed",
  WAIVED = "waived",
}

@Entity("penalties")
export class Penalty {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  project_id: string;

  @Column({ nullable: true })
  phase_id: string;

  @Column({ nullable: true })
  complaint_id: string;

  @Column({ type: "decimal", precision: 15, scale: 2 })
  amount: number;

  @Column({ type: "text" })
  reason: string;

  @Column({
    type: "enum",
    enum: PenaltyStatus,
    default: PenaltyStatus.PENDING,
  })
  status: PenaltyStatus;

  @Column({ nullable: true })
  assigned_to: string;

  @Column()
  assigned_by: string;

  @Column({ type: "text", nullable: true })
  appeal_reason: string;

  @Column({ type: "timestamp", nullable: true })
  appealed_at: Date;

  @Column({ type: "timestamp", nullable: true })
  paid_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Project, { onDelete: "CASCADE" })
  @JoinColumn({ name: "project_id" })
  project: Project;

  @ManyToOne(() => Phase, { onDelete: "CASCADE", nullable: true })
  @JoinColumn({ name: "phase_id" })
  phase: Phase;

  @ManyToOne(() => Complaint, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "complaint_id" })
  complaint: Complaint;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "assigned_to" })
  assignee: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: "assigned_by" })
  assigner: User;
}

