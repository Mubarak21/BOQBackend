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

export type ProjectAccessRequestStatus = "pending" | "approved" | "denied";

@Entity("project_access_requests")
export class ProjectAccessRequest {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  project_id: string;

  @ManyToOne(() => Project, { onDelete: "CASCADE" })
  @JoinColumn({ name: "project_id" })
  project: Project;

  @Column()
  requester_id: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "requester_id" })
  requester: User;

  @Column({ type: "varchar", length: 16, default: "pending" })
  status: ProjectAccessRequestStatus;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: "timestamp", nullable: true })
  reviewed_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
