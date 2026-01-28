import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from "typeorm";
import { Inventory } from "./inventory.entity";
import { Project } from "./project.entity";
import { Phase } from "./phase.entity";
import { User } from "./user.entity";

export enum UsageType {
  USED = "used",
  RETURNED = "returned",
  DAMAGED = "damaged",
  LOST = "lost",
  ADJUSTMENT = "adjustment",
}

/**
 * Separate table for inventory usage tracking
 * Provides detailed history of inventory movements
 */
@Entity("inventory_usage_logs")
@Index(["inventoryId", "createdAt"])
@Index(["projectId", "createdAt"])
export class InventoryUsageLog {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "inventory_id" })
  inventoryId: string;

  @ManyToOne(() => Inventory, (inventory) => inventory.usageLogs, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "inventory_id" })
  inventory: Inventory;

  @Column({ name: "project_id", nullable: true })
  projectId: string;

  @ManyToOne(() => Project, { nullable: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "project_id" })
  project: Project;

  @Column({ name: "phase_id", nullable: true })
  phaseId: string;

  @ManyToOne(() => Phase, { nullable: true })
  @JoinColumn({ name: "phase_id" })
  phase: Phase;

  @Column({
    type: "enum",
    enum: UsageType,
  })
  usage_type: UsageType;

  @Column({ type: "int" })
  quantity: number;

  @Column({ type: "decimal", precision: 15, scale: 2, nullable: true })
  unit_price: number;

  @Column({ type: "decimal", precision: 15, scale: 2, nullable: true })
  total_cost: number;

  @Column({ type: "text", nullable: true })
  notes: string;

  @Column({ name: "recorded_by" })
  recordedBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "recorded_by" })
  recorder: User;

  @Column({ type: "date" })
  usage_date: Date;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
