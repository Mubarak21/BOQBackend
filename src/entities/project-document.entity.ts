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

export enum DocumentCategory {
  CONTRACT = "contract",
  PERMIT = "permit",
  DRAWING = "drawing",
  REPORT = "report",
  SPECIFICATION = "specification",
  OTHER = "other",
}

@Entity("project_documents")
export class ProjectDocument {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "project_id" })
  project_id: string;

  @ManyToOne(() => Project, { onDelete: "CASCADE" })
  @JoinColumn({ name: "project_id" })
  project: Project;

  @Column({ type: "varchar", length: 255, name: "file_name" })
  file_name: string;

  @Column({ type: "varchar", length: 500, name: "display_name", nullable: true })
  display_name: string | null;

  @Column({ type: "text", nullable: true })
  description: string | null;

  @Column({ type: "varchar", length: 500, name: "file_path" })
  file_path: string;

  @Column({ type: "varchar", length: 255, name: "mime_type", nullable: true })
  mime_type: string | null;

  @Column({
    type: "enum",
    enum: DocumentCategory,
    default: DocumentCategory.OTHER,
  })
  category: DocumentCategory;

  @Column({ name: "uploaded_by" })
  uploaded_by: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "uploaded_by" })
  uploadedByUser: User;

  @CreateDateColumn({ name: "created_at" })
  created_at: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at: Date;
}
