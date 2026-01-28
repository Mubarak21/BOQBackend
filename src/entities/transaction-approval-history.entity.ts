import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { ProjectTransaction } from "../finance/entities/project-transaction.entity";
import { User } from "./user.entity";

export enum ApprovalAction {
  APPROVED = "approved",
  REJECTED = "rejected",
  PENDING = "pending",
  REQUESTED_CHANGES = "requested_changes",
}

/**
 * Separate table for transaction approval history
 * Tracks all approval actions and comments for audit purposes
 */
@Entity("transaction_approval_history")
export class TransactionApprovalHistory {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "transaction_id" })
  transactionId: string;

  @ManyToOne(() => ProjectTransaction, (transaction) => transaction.approvalHistory, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "transaction_id" })
  transaction: ProjectTransaction;

  @Column({
    type: "enum",
    enum: ApprovalAction,
  })
  action: ApprovalAction;

  @Column({ name: "action_by", nullable: true })
  actionBy: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "action_by" })
  actor: User;

  @Column({ type: "text", nullable: true })
  comment: string;

  @Column({ type: "text", nullable: true })
  reason: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
