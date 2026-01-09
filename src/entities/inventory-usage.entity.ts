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
import { Inventory } from "./inventory.entity";
import { Phase } from "./phase.entity";

@Entity("inventory_usage")
export class InventoryUsage {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  inventory_id: string;

  @ManyToOne(() => Inventory, { onDelete: "CASCADE" })
  @JoinColumn({ name: "inventory_id" })
  inventory: Inventory;

  @Column()
  project_id: string;

  @ManyToOne(() => Project, { onDelete: "CASCADE" })
  @JoinColumn({ name: "project_id" })
  project: Project;

  @Column({ type: "int" })
  quantity_used: number;

  @Column({ nullable: true })
  phase_id: string;

  @ManyToOne(() => Phase, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "phase_id" })
  phase: Phase;

  @Column({ type: "text", nullable: true })
  notes: string;

  @Column()
  used_by: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "used_by" })
  user: User;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  used_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

