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

/**
 * Separate table for user sessions
 * Tracks active sessions for security and analytics
 */
@Entity("user_sessions")
@Index(["userId", "is_active"])
@Index(["token"])
export class UserSession {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "user_id" })
  userId: string;

  @ManyToOne(() => User, (user) => user.sessions, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ unique: true })
  token: string; // JWT token or session token

  @Column({ nullable: true })
  ip_address: string;

  @Column({ nullable: true })
  user_agent: string;

  @Column({ nullable: true })
  device_type: string; // mobile, desktop, tablet

  @Column({ nullable: true })
  browser: string;

  @Column({ nullable: true })
  os: string;

  @Column({ type: "timestamp" })
  expires_at: Date;

  @Column({ type: "boolean", default: true })
  is_active: boolean;

  @Column({ type: "timestamp", nullable: true })
  last_activity: Date;

  @Column({ type: "text", nullable: true })
  location: string; // City, Country

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
