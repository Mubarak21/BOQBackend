import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Project } from "./project.entity";

/**
 * Separate table for project financial summaries
 * This allows for better scalability and separation of concerns
 */
@Entity("project_financial_summaries")
export class ProjectFinancialSummary {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  project_id: string;

  @OneToOne(() => Project, (project) => project.financialSummary, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "project_id" })
  project: Project;

  @Column({
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0.0,
    name: "total_budget",
  })
  totalBudget: number;

  @Column({
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0.0,
    name: "allocated_budget",
  })
  allocatedBudget: number;

  @Column({
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0.0,
    name: "spent_amount",
  })
  spentAmount: number;

  @Column({
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0.0,
    name: "estimated_savings",
  })
  estimatedSavings: number;

  @Column({
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0.0,
    name: "received_amount",
  })
  receivedAmount: number;

  @Column({
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0.0,
    name: "paid_amount",
  })
  paidAmount: number;

  @Column({
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0.0,
    name: "net_cash_flow",
  })
  netCashFlow: number;

  @Column({
    type: "enum",
    enum: ["on_track", "warning", "over_budget", "excellent"],
    default: "on_track",
    name: "financial_status",
  })
  financialStatus: "on_track" | "warning" | "over_budget" | "excellent";

  @Column({
    type: "timestamp",
    nullable: true,
    name: "budget_last_updated",
  })
  budgetLastUpdated: Date;

  @Column({
    type: "timestamp",
    nullable: true,
    name: "last_transaction_date",
  })
  lastTransactionDate: Date;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
