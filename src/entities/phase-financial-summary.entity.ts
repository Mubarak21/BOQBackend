import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Phase } from "./phase.entity";
import { ContractorPhase } from "./contractor-phase.entity";
import { SubContractorPhase } from "./sub-contractor-phase.entity";

/**
 * Separate table for phase financial summaries
 * Tracks financial data separately from phase metadata
 */
@Entity("phase_financial_summaries")
export class PhaseFinancialSummary {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  // Legacy phase relationship (for backward compatibility)
  @Column({ nullable: true })
  phase_id: string;

  @OneToOne(() => Phase, (phase) => phase.financialSummary, {
    nullable: true,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "phase_id" })
  phase: Phase;

  // Contractor phase relationship
  @Column({ nullable: true, unique: true, name: "contractor_phase_id" })
  contractorPhaseId: string;

  @OneToOne(() => ContractorPhase, (phase) => phase.financialSummary, {
    nullable: true,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "contractor_phase_id" })
  contractorPhase: ContractorPhase;

  // Sub-contractor phase relationship
  @Column({ nullable: true, unique: true, name: "sub_contractor_phase_id" })
  subContractorPhaseId: string;

  @OneToOne(() => SubContractorPhase, (phase) => phase.financialSummary, {
    nullable: true,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "sub_contractor_phase_id" })
  subContractorPhase: SubContractorPhase;

  @Column({
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0.0,
    name: "allocated_budget",
  })
  allocatedBudget: number;

  @Column({
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0.0,
    name: "spent_amount",
  })
  spentAmount: number;

  @Column({
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0.0,
    name: "estimated_cost",
  })
  estimatedCost: number;

  @Column({
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0.0,
    name: "actual_cost",
  })
  actualCost: number;

  @Column({
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0.0,
    name: "variance",
  })
  variance: number;

  @Column({
    type: "enum",
    enum: ["on_track", "warning", "over_budget"],
    default: "on_track",
    name: "financial_status",
  })
  financialStatus: "on_track" | "warning" | "over_budget";

  @Column({
    type: "timestamp",
    nullable: true,
    name: "last_updated",
  })
  lastUpdated: Date;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
