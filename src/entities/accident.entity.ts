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
import { Project } from "./project.entity";

export enum AccidentSeverity {
  MINOR = "minor",
  MODERATE = "moderate",
  SERIOUS = "serious",
  FATAL = "fatal",
}

export enum AccidentStatus {
  REPORTED = "reported",
  UNDER_REVIEW = "under_review",
  CLOSED = "closed",
}

@Entity("accidents")
export class Accident {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "project_id" })
  project_id: string;

  @ManyToOne(() => Project, { onDelete: "CASCADE" })
  @JoinColumn({ name: "project_id" })
  project: Project;

  @Column({ name: "reported_by" })
  reported_by: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "reported_by" })
  reportedByUser: User;

  @Column({ type: "date", name: "accident_date" })
  accident_date: string;

  @Column({ type: "text" })
  description: string;

  @Column({
    type: "enum",
    enum: AccidentSeverity,
    default: AccidentSeverity.MODERATE,
  })
  severity: AccidentSeverity;

  @Column({ type: "varchar", length: 500, nullable: true })
  location: string | null;

  @Column({ type: "int", name: "injured_count", default: 0 })
  injured_count: number;

  @Column({ type: "text", name: "action_taken", nullable: true })
  action_taken: string | null;

  @Column({
    type: "enum",
    enum: AccidentStatus,
    default: AccidentStatus.REPORTED,
  })
  status: AccidentStatus;

  @CreateDateColumn({ name: "created_at" })
  created_at: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at: Date;
}
