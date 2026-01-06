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
import { SubPhase } from "./sub-phase.entity";

export enum ComplaintStatus {
  OPEN = "open",
  RESOLVED = "resolved",
  APPEALED = "appealed",
}

@Entity("complaints")
export class Complaint {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  project_id: string;

  @Column({ nullable: true })
  phase_id: string;

  @Column({ nullable: true })
  sub_phase_id: string;

  @Column()
  raised_by: string;

  @Column()
  title: string;

  @Column({ type: "text" })
  description: string;

  @Column({
    type: "enum",
    enum: ComplaintStatus,
    default: ComplaintStatus.OPEN,
  })
  status: ComplaintStatus;

  @Column({ type: "text", nullable: true })
  response: string;

  @Column({ nullable: true })
  responded_by: string;

  @Column({ type: "timestamp", nullable: true })
  responded_at: Date;

  @Column({ type: "text", nullable: true })
  appeal_reason: string;

  @Column({ type: "timestamp", nullable: true })
  appealed_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "raised_by" })
  raiser: User;

  @ManyToOne(() => Project, { onDelete: "CASCADE" })
  @JoinColumn({ name: "project_id" })
  project: Project;

  @ManyToOne(() => Phase, { onDelete: "CASCADE", nullable: true })
  @JoinColumn({ name: "phase_id" })
  phase: Phase;

  @ManyToOne(() => SubPhase, { onDelete: "CASCADE", nullable: true })
  @JoinColumn({ name: "sub_phase_id" })
  subPhase: SubPhase;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "responded_by" })
  responder: User;
}
