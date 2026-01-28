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

export enum AttachmentType {
  RECEIPT = "receipt",
  INVOICE = "invoice",
  QUOTE = "quote",
  CONTRACT = "contract",
  OTHER = "other",
}

/**
 * Separate table for transaction attachments
 * Allows multiple files per transaction instead of single receipt_url
 */
@Entity("transaction_attachments")
export class TransactionAttachment {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "transaction_id" })
  transactionId: string;

  @ManyToOne(() => ProjectTransaction, (transaction) => transaction.attachments, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "transaction_id" })
  transaction: ProjectTransaction;

  @Column({
    type: "enum",
    enum: AttachmentType,
    default: AttachmentType.RECEIPT,
  })
  type: AttachmentType;

  @Column()
  file_url: string;

  @Column({ nullable: true })
  file_name: string;

  @Column({ nullable: true })
  file_mime_type: string;

  @Column({ type: "bigint", nullable: true })
  file_size: number;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ name: "uploaded_by" })
  uploadedBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "uploaded_by" })
  uploader: User;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
