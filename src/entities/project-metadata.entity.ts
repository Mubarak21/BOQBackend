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
 * Separate table for project metadata and extended information
 * This keeps the main project table lean and allows for extensibility
 */
@Entity("project_metadata")
export class ProjectMetadata {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  project_id: string;

  @OneToOne(() => Project, (project) => project.metadata, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "project_id" })
  project: Project;

  @Column({ type: "text", nullable: true })
  location: string;

  @Column({ type: "text", nullable: true })
  address: string;

  @Column({ type: "text", nullable: true })
  coordinates: string; // JSON string for lat/lng

  @Column({ type: "text", nullable: true })
  client_name: string;

  @Column({ type: "text", nullable: true })
  client_contact: string;

  @Column({ type: "text", nullable: true })
  client_email: string;

  @Column({ type: "text", nullable: true })
  architect: string;

  @Column({ type: "text", nullable: true })
  engineer: string;

  @Column({ type: "text", nullable: true })
  contractor_name: string;

  @Column({ type: "text", nullable: true })
  contract_number: string;

  @Column({ type: "date", nullable: true })
  contract_date: Date;

  @Column({ type: "text", nullable: true })
  permit_number: string;

  @Column({ type: "date", nullable: true })
  permit_issued_date: Date;

  @Column({ type: "text", nullable: true })
  notes: string;

  @Column({ type: "jsonb", nullable: true })
  custom_fields: Record<string, any>; // For extensibility

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
