import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Check,
} from "typeorm";
import { Project } from "../../entities/project.entity";
import { User } from "../../entities/user.entity";
import { BudgetCategory } from "./budget-category.entity";

export enum TransactionType {
  EXPENSE = "expense",
  REFUND = "refund",
  ADJUSTMENT = "adjustment",
}

export enum ApprovalStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

@Entity("project_transactions")
@Check(`"amount" > 0`)
export class ProjectTransaction {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "project_id" })
  projectId: string;

  @ManyToOne(() => Project, { onDelete: "CASCADE" })
  @JoinColumn({ name: "project_id" })
  project: Project;

  @Column({ name: "category_id", nullable: true })
  categoryId: string;

  @ManyToOne(() => BudgetCategory, { onDelete: "SET NULL" })
  @JoinColumn({ name: "category_id" })
  category: BudgetCategory;

  @Column({ length: 50, unique: true, name: "transaction_number" })
  transactionNumber: string;

  @Column({ type: "decimal", precision: 15, scale: 2 })
  amount: number;

  @Column({
    type: "enum",
    enum: TransactionType,
  })
  type: TransactionType;

  @Column({ type: "text" })
  description: string;

  @Column({ length: 255, nullable: true })
  vendor: string;

  @Column({ length: 100, nullable: true, name: "invoice_number" })
  invoiceNumber: string;

  @Column({ type: "date", name: "transaction_date" })
  transactionDate: Date;

  @Column({
    type: "enum",
    enum: ApprovalStatus,
    default: ApprovalStatus.PENDING,
    name: "approval_status",
  })
  approvalStatus: ApprovalStatus;

  @Column({ name: "approved_by", nullable: true })
  approvedBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "approved_by" })
  approver: User;

  @Column({ type: "timestamp", nullable: true, name: "approved_at" })
  approvedAt: Date;

  @Column({ length: 500, nullable: true, name: "receipt_url" })
  receiptUrl: string;

  @Column({ type: "text", nullable: true })
  notes: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @Column({ name: "created_by" })
  createdBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "created_by" })
  creator: User;
}
