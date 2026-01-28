import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from "typeorm";
import { User } from "./user.entity";

export enum AuditAction {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  VIEW = "view",
  EXPORT = "export",
  APPROVE = "approve",
  REJECT = "reject",
  LOGIN = "login",
  LOGOUT = "logout",
  PASSWORD_CHANGE = "password_change",
  PERMISSION_CHANGE = "permission_change",
}

export enum AuditEntityType {
  USER = "user",
  PROJECT = "project",
  PHASE = "phase",
  TASK = "task",
  TRANSACTION = "transaction",
  INVENTORY = "inventory",
  BUDGET = "budget",
  REPORT = "report",
  COMPLAINT = "complaint",
}

/**
 * Comprehensive audit log table
 * Tracks all important actions in the system for security and compliance
 */
@Entity("audit_logs")
@Index(["entity_type", "entity_id"])
@Index(["userId", "createdAt"])
@Index(["action", "createdAt"])
export class AuditLog {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({
    type: "enum",
    enum: AuditAction,
  })
  action: AuditAction;

  @Column({
    type: "enum",
    enum: AuditEntityType,
  })
  entity_type: AuditEntityType;

  @Column({ nullable: true })
  entity_id: string;

  @Column({ name: "user_id", nullable: true })
  userId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ type: "text" })
  description: string;

  @Column({ type: "jsonb", nullable: true })
  old_values: Record<string, any>;

  @Column({ type: "jsonb", nullable: true })
  new_values: Record<string, any>;

  @Column({ nullable: true })
  ip_address: string;

  @Column({ nullable: true })
  user_agent: string;

  @Column({ type: "text", nullable: true })
  notes: string;

  @Column({ type: "boolean", default: false })
  is_successful: boolean;

  @Column({ type: "text", nullable: true })
  error_message: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
