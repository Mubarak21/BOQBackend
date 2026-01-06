import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { User } from "./user.entity";
import { Phase } from "./phase.entity";
import { SubPhase } from "./sub-phase.entity";

export enum EvidenceType {
  PHOTO = "photo",
  VIDEO = "video",
  NOTE = "note",
  DOCUMENT = "document",
}

@Entity("phase_evidence")
export class PhaseEvidence {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  phase_id: string;

  @Column({ nullable: true })
  sub_phase_id: string;

  @Column({
    type: "enum",
    enum: EvidenceType,
  })
  type: EvidenceType;

  @Column({ nullable: true })
  file_url: string;

  @Column({ type: "text", nullable: true })
  notes: string;

  @Column()
  uploaded_by: string;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Phase, { onDelete: "CASCADE" })
  @JoinColumn({ name: "phase_id" })
  phase: Phase;

  @ManyToOne(() => SubPhase, { onDelete: "CASCADE", nullable: true })
  @JoinColumn({ name: "sub_phase_id" })
  subPhase: SubPhase;

  @ManyToOne(() => User)
  @JoinColumn({ name: "uploaded_by" })
  uploader: User;
}

