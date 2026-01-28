import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Project } from "./project.entity";

/**
 * Separate table for project settings and configurations
 * Keeps project table lean and allows for extensible settings
 */
@Entity("project_settings")
export class ProjectSettings {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  project_id: string;

  @OneToOne(() => Project, (project) => project.settings, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "project_id" })
  project: Project;

  @Column({ type: "boolean", default: true })
  allow_collaborator_invites: boolean;

  @Column({ type: "boolean", default: true })
  allow_task_creation: boolean;

  @Column({ type: "boolean", default: true })
  allow_phase_modification: boolean;

  @Column({ type: "boolean", default: false })
  require_approval_for_transactions: boolean;

  @Column({ type: "decimal", precision: 15, scale: 2, nullable: true })
  approval_threshold: number; // Amount above which approval is required

  @Column({ type: "boolean", default: true })
  send_notifications: boolean;

  @Column({ type: "boolean", default: true })
  track_inventory: boolean;

  @Column({ type: "boolean", default: true })
  track_time: boolean;

  @Column({ type: "varchar", length: 50, default: "USD" })
  currency: string;

  @Column({ type: "varchar", length: 50, default: "en" })
  language: string;

  @Column({ type: "jsonb", nullable: true })
  custom_settings: Record<string, any>;

  @Column({ type: "jsonb", nullable: true })
  notification_rules: Record<string, any>;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
