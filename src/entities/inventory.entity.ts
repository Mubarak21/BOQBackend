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

export enum InventoryCategory {
  MATERIALS = "materials",
  EQUIPMENT = "equipment",
  TOOLS = "tools",
  SERVICES = "services",
  LABOR = "labor",
  OTHER = "other",
}

@Entity("inventory")
export class Inventory {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  unit: string; // e.g., "kg", "piece", "meter", "hour"

  @Column({
    type: "decimal",
    precision: 15,
    scale: 2,
  })
  unit_price: number;

  @Column({
    type: "enum",
    enum: InventoryCategory,
    default: InventoryCategory.MATERIALS,
  })
  category: InventoryCategory;

  @Column({ nullable: true })
  brand: string;

  @Column({ nullable: true })
  model: string;

  @Column({ nullable: true })
  supplier: string;

  @Column({ nullable: true })
  supplier_contact: string;

  @Column({ type: "int", default: 0 })
  quantity_available: number;

  @Column({ type: "int", default: 0 })
  quantity_used: number; // Total quantity used for the project

  @Column({ type: "int", default: 0 })
  minimum_stock: number;

  @Column({ nullable: true })
  sku: string; // Stock Keeping Unit

  @Column({ nullable: true })
  barcode: string;

  @Column("text", { array: true, default: [] })
  tags: string[];

  @Column({ default: true })
  is_active: boolean;

  @Column({ nullable: true })
  notes: string;

  // Link to project (nullable to support global inventory)
  @Column({ nullable: true })
  project_id: string;

  @ManyToOne(() => Project, { nullable: true })
  @JoinColumn({ name: "project_id" })
  project: Project;

  // Track who added this inventory item
  @Column()
  created_by: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "created_by" })
  creator: User;

  // Track the source document if uploaded
  @Column({ nullable: true })
  source_document: string;

  // Evidence picture (required)
  @Column({ nullable: true })
  picture_url: string;

  // Invoice document (optional)
  @Column({ nullable: true })
  invoice_url: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
