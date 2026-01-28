import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { User } from "./user.entity";
import { Project } from "./project.entity";
import { Supplier } from "./supplier.entity";
import { InventoryUsageLog } from "./inventory-usage-log.entity";

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

  // Supplier moved to separate Supplier table
  @Column({ name: "supplier_id", nullable: true })
  supplierId: string;

  @ManyToOne(() => Supplier, (supplier) => supplier.inventory_items, {
    nullable: true,
  })
  @JoinColumn({ name: "supplier_id" })
  supplier: Supplier;

  // Usage logs tracking
  @OneToMany(() => InventoryUsageLog, (log) => log.inventory)
  usageLogs: InventoryUsageLog[];

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
