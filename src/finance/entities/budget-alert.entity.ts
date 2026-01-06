import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Project } from "../../entities/project.entity";

export enum AlertType {
  WARNING = "warning",
  CRITICAL = "critical",
  OVER_BUDGET = "over_budget",
}

@Entity("budget_alerts")
export class BudgetAlert {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "project_id" })
  projectId: string;

  @ManyToOne(() => Project, { onDelete: "CASCADE" })
  @JoinColumn({ name: "project_id" })
  project: Project;

  @Column({
    type: "enum",
    enum: AlertType,
    name: "alert_type",
  })
  alertType: AlertType;

  @Column({
    type: "decimal",
    precision: 5,
    scale: 2,
    name: "threshold_percentage",
  })
  thresholdPercentage: number;

  @Column({
    type: "decimal",
    precision: 5,
    scale: 2,
    name: "current_percentage",
  })
  currentPercentage: number;

  @CreateDateColumn({ name: "triggered_at" })
  triggeredAt: Date;

  @Column({ type: "timestamp", nullable: true, name: "resolved_at" })
  resolvedAt: Date;

  @Column({ type: "boolean", default: false, name: "notification_sent" })
  notificationSent: boolean;

  @Column({
    type: "text",
    array: true,
    nullable: true,
    name: "email_recipients",
  })
  emailRecipients: string[];

  @Column({ type: "boolean", default: true, name: "is_active" })
  isActive: boolean;

  get isResolved(): boolean {
    return this.resolvedAt !== null;
  }

  get severityLevel(): "low" | "medium" | "high" {
    switch (this.alertType) {
      case AlertType.WARNING:
        return "low";
      case AlertType.CRITICAL:
        return "medium";
      case AlertType.OVER_BUDGET:
        return "high";
      default:
        return "medium";
    }
  }
}
