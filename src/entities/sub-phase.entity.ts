import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Phase } from "./phase.entity";

@Entity()
export class SubPhase {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ default: false })
  isCompleted: boolean;

  @ManyToOne(() => Phase, (phase) => phase.subPhases, { onDelete: "CASCADE" })
  @JoinColumn({ name: "phase_id" })
  phase: Phase;

  @Column()
  phase_id: string;
}
