import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Project } from "../../entities/project.entity";
import { User } from "../../entities/user.entity";

export enum VerificationStatus {
  PENDING = "pending",
  VERIFIED = "verified",
  DISPUTED = "disputed",
}

@Entity("project_savings")
export class ProjectSavings {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "project_id" })
  projectId: string;

  @ManyToOne(() => Project, { onDelete: "CASCADE" })
  @JoinColumn({ name: "project_id" })
  project: Project;

  @Column({ length: 100 })
  category: string;

  @Column({ type: "decimal", precision: 15, scale: 2, name: "budgeted_amount" })
  budgetedAmount: number;

  @Column({ type: "decimal", precision: 15, scale: 2, name: "actual_amount" })
  actualAmount: number;

  // Computed properties - savedAmount and savingsPercentage will be calculated in getters

  @Column({ type: "text", nullable: true })
  reason: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "date", nullable: true, name: "achieved_date" })
  achievedDate: Date;

  @Column({
    type: "enum",
    enum: VerificationStatus,
    default: VerificationStatus.PENDING,
    name: "verification_status",
  })
  verificationStatus: VerificationStatus;

  @Column({ name: "verified_by", nullable: true })
  verifiedBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "verified_by" })
  verifier: User;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @Column({ name: "created_by" })
  createdBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "created_by" })
  creator: User;

  // Computed properties
  get savedAmount(): number {
    return this.budgetedAmount - this.actualAmount;
  }

  get savingsPercentage(): number {
    return this.budgetedAmount > 0
      ? ((this.budgetedAmount - this.actualAmount) / this.budgetedAmount) * 100
      : 0;
  }
}
