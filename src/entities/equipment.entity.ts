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

export enum EquipmentCategory {
  MACHINERY = "machinery",
  VEHICLES = "vehicles",
  TOOLS = "tools",
  OTHER = "other",
}

export enum EquipmentStatus {
  IN_USE = "in_use",
  AVAILABLE = "available",
  MAINTENANCE = "maintenance",
}

@Entity("equipment")
export class Equipment {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "project_id" })
  project_id: string;

  @ManyToOne(() => Project, { onDelete: "CASCADE" })
  @JoinColumn({ name: "project_id" })
  project: Project;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "text", nullable: true })
  description: string | null;

  @Column({ type: "int", default: 1 })
  quantity: number;

  @Column({
    type: "enum",
    enum: EquipmentCategory,
    default: EquipmentCategory.OTHER,
  })
  category: EquipmentCategory;

  @Column({
    type: "enum",
    enum: EquipmentStatus,
    default: EquipmentStatus.AVAILABLE,
  })
  status: EquipmentStatus;

  @Column({ type: "varchar", length: 255, nullable: true, name: "serial_number" })
  serial_number: string | null;

  @CreateDateColumn({ name: "created_at" })
  created_at: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at: Date;
}
