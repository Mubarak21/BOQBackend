import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./user.entity";

/**
 * Separate table for user preferences
 * Allows for better scalability and easier preference management
 */
@Entity("user_preferences")
export class UserPreferences {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  user_id: string;

  @OneToOne(() => User, (user) => user.preferences, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ type: "jsonb", default: {} })
  notification_preferences: {
    email: boolean;
    project_updates: boolean;
    task_updates: boolean;
    financial_updates: boolean;
    inventory_alerts: boolean;
    system_notifications: boolean;
  };

  @Column({ type: "varchar", length: 50, default: "en" })
  language: string;

  @Column({ type: "varchar", length: 50, default: "UTC" })
  timezone: string;

  @Column({ type: "varchar", length: 20, default: "dark" })
  theme: string;

  @Column({ type: "int", default: 10 })
  items_per_page: number;

  @Column({ type: "jsonb", nullable: true })
  dashboard_layout: Record<string, any>;

  @Column({ type: "jsonb", nullable: true })
  table_preferences: Record<string, any>; // Column visibility, sorting, etc.

  @Column({ type: "boolean", default: true })
  email_notifications_enabled: boolean;

  @Column({ type: "boolean", default: true })
  push_notifications_enabled: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
