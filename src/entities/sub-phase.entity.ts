import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
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

  @ManyToOne(() => SubPhase, (subPhase) => subPhase.subPhases, { nullable: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "parent_sub_phase_id" })
  parentSubPhase: SubPhase;

  @Column({ nullable: true })
  parent_sub_phase_id: string;

  @OneToMany(() => SubPhase, (subPhase) => subPhase.parentSubPhase)
  subPhases: SubPhase[];
}
