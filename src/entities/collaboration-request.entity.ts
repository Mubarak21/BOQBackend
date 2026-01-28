import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Project } from "./project.entity";
import { User } from "./user.entity";

export enum CollaborationRequestStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  REJECTED = "rejected",
}

@Entity()
export class CollaborationRequest {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  projectId: string;

  @ManyToOne(() => Project, { onDelete: "CASCADE" })
  @JoinColumn({ name: "projectId" })
  project: Project;

  @Column({ nullable: true })
  userId: string | null; // The invited user (null if invite is by email only)

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "userId" })
  user: User | null;

  @Column({ nullable: true })
  inviteEmail: string | null; // Email for unregistered users

  @Column()
  inviterId: string; // The owner

  @ManyToOne(() => User)
  @JoinColumn({ name: "inviterId" })
  inviter: User;

  @Column({
    type: "enum",
    enum: CollaborationRequestStatus,
    default: CollaborationRequestStatus.PENDING,
  })
  status: CollaborationRequestStatus;

  @Column({ type: "text", nullable: true })
  tokenHash: string; // Hashed token for secure invite links

  @Column({ type: "timestamp", nullable: true })
  expiresAt: Date; // Invite expiration date

  @Column({ nullable: true })
  invitedRole: string | null; // Role assigned when invited (for consultants to specify)

  @CreateDateColumn()
  createdAt: Date;
}
