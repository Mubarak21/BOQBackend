import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Project } from "./project.entity";
import { User } from "./user.entity";

export enum VisitorPriority {
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
}

@Entity("visitors")
export class Visitor {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "project_id" })
  project_id: string;

  @ManyToOne(() => Project, { onDelete: "CASCADE" })
  @JoinColumn({ name: "project_id" })
  project: Project;

  @Column({ name: "visitor_name" })
  visitor_name: string;

  @Column({ name: "company", nullable: true })
  company: string | null;

  @Column({ type: "date", name: "visit_date" })
  visit_date: string;

  @Column({
    type: "enum",
    enum: VisitorPriority,
    default: VisitorPriority.MEDIUM,
  })
  priority: VisitorPriority;

  @Column({ type: "text", nullable: true })
  purpose: string | null;

  @Column({ name: "recorded_by" })
  recorded_by: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "recorded_by" })
  recordedByUser: User;

  @CreateDateColumn({ name: "created_at" })
  created_at: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at: Date;
}
