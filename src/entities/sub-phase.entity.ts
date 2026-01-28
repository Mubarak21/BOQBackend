import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { Phase } from "./phase.entity";
import { ContractorPhase } from "./contractor-phase.entity";
import { SubContractorPhase } from "./sub-contractor-phase.entity";

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

  // Legacy phase relationship (for backward compatibility)
  @ManyToOne(() => Phase, (phase) => phase.subPhases, { nullable: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "phase_id" })
  phase: Phase;

  @Column({ nullable: true })
  phase_id: string;

  // Contractor phase relationship
  @Column({ nullable: true, name: "contractor_phase_id" })
  contractorPhaseId: string;

  @ManyToOne(() => ContractorPhase, (phase) => phase.subPhases, { nullable: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "contractor_phase_id" })
  contractorPhase: ContractorPhase;

  // Sub-contractor phase relationship
  @Column({ nullable: true, name: "sub_contractor_phase_id" })
  subContractorPhaseId: string;

  @ManyToOne(() => SubContractorPhase, (phase) => phase.subPhases, { nullable: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "sub_contractor_phase_id" })
  subContractorPhase: SubContractorPhase;

  @ManyToOne(() => SubPhase, (subPhase) => subPhase.subPhases, { nullable: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "parent_sub_phase_id" })
  parentSubPhase: SubPhase;

  @Column({ nullable: true })
  parent_sub_phase_id: string;

  @OneToMany(() => SubPhase, (subPhase) => subPhase.parentSubPhase)
  subPhases: SubPhase[];
}
