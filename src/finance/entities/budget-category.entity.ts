import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Check,
} from "typeorm";
import { Project } from "../../entities/project.entity";
import { User } from "../../entities/user.entity";
import { ProjectTransaction } from "./project-transaction.entity";

@Entity("budget_categories")
@Check(`"budgeted_amount" >= 0`)
@Check(`"spent_amount" >= 0`)
export class BudgetCategory {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "project_id" })
  projectId: string;

  @ManyToOne(() => Project, { onDelete: "CASCADE" })
  @JoinColumn({ name: "project_id" })
  project: Project;

  @Column({ length: 100 })
  name: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0.0,
    name: "budgeted_amount",
  })
  budgetedAmount: number;

  @Column({
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0.0,
    name: "spent_amount",
  })
  spentAmount: number;

  @Column({ type: "boolean", default: true, name: "is_active" })
  isActive: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @Column({ name: "created_by", nullable: true })
  createdBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "created_by" })
  creator: User;

  @OneToMany(() => ProjectTransaction, (transaction) => transaction.category)
  transactions: ProjectTransaction[];

  // Computed properties
  get remainingAmount(): number {
    // Ensure values are numbers before calculation
    const budgeted = typeof this.budgetedAmount === 'number' 
      ? this.budgetedAmount 
      : parseFloat(String(this.budgetedAmount || 0)) || 0;
    const spent = typeof this.spentAmount === 'number' 
      ? this.spentAmount 
      : parseFloat(String(this.spentAmount || 0)) || 0;
    const remaining = budgeted - spent;
    // Clamp to reasonable range to prevent overflow
    return Math.max(Math.min(remaining, 9999999999999.99), -9999999999999.99);
  }

  get utilizationPercentage(): number {
    return this.budgetedAmount > 0
      ? (this.spentAmount / this.budgetedAmount) * 100
      : 0;
  }

  get status(): "on_track" | "warning" | "over_budget" {
    const utilization = this.utilizationPercentage;
    if (utilization > 100) return "over_budget";
    if (utilization > 90) return "warning";
    return "on_track";
  }
}
