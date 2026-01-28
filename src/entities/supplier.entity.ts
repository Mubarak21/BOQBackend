import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Inventory } from "./inventory.entity";

/**
 * Separate table for suppliers
 * This normalizes supplier information and allows for better tracking
 */
@Entity("suppliers")
export class Supplier {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  contact_person: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  tax_id: string;

  @Column({ nullable: true })
  website: string;

  @Column({ type: "text", nullable: true })
  notes: string;

  @Column({ type: "jsonb", nullable: true })
  payment_terms: Record<string, any>; // e.g., { payment_days: 30, discount_percentage: 2 }

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: "decimal", precision: 5, scale: 2, nullable: true })
  rating: number; // Supplier rating out of 5

  @OneToMany(() => Inventory, (inventory) => inventory.supplier)
  inventory_items: Inventory[];

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
