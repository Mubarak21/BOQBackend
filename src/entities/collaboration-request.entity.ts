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

  @ManyToOne(() => Project)
  @JoinColumn({ name: "projectId" })
  project: Project;

  @Column()
  userId: string; // The invited user

  @ManyToOne(() => User)
  @JoinColumn({ name: "userId" })
  user: User;

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

  @CreateDateColumn()
  createdAt: Date;
}
