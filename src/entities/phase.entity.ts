import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Project } from "./project.entity";
import { Task } from "./task.entity";
import { User } from "./user.entity";
import { SubPhase } from "./sub-phase.entity";
import { PhaseFinancialSummary } from "./phase-financial-summary.entity";

export enum PhaseStatus {
  NOT_STARTED = "not_started",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  DELAYED = "delayed",
}

@Entity()
export class Phase {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ nullable: true })
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: "date", nullable: true })
  start_date: Date;

  @Column({ type: "timestamp", nullable: true })
  end_date: Date;

  @Column({ type: "decimal", precision: 15, scale: 2, nullable: true })
  budget: number;

  @Column({ type: "decimal", precision: 5, scale: 2, nullable: true })
  progress: number;

  @Column({
    type: "enum",
    enum: PhaseStatus,
    default: PhaseStatus.NOT_STARTED,
  })
  status: PhaseStatus;

  @ManyToOne(() => Project, (project) => project.phases, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "project_id" })
  project: Project;

  @Column()
  project_id: string;

  @OneToMany(() => Task, (task) => task.phase)
  tasks: Task[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ nullable: true })
  deliverables: string;

  @Column({ nullable: true })
  requirements: string;

  @Column({ type: "timestamp", nullable: true })
  due_date: Date;

  @Column({ nullable: true })
  reference_task_id: string;

  @Column({ type: "boolean", default: true })
  is_active: boolean;

  @Column({ type: "boolean", default: false })
  from_boq: boolean;

  // Track which BOQ type this phase came from
  @Column({
    type: "enum",
    enum: ["contractor", "sub_contractor"],
    nullable: true,
    name: "boq_type",
  })
  boqType: "contractor" | "sub_contractor" | null;

  // Link sub-contractor phases to contractor phases
  @Column({ nullable: true, name: "linked_contractor_phase_id" })
  linkedContractorPhaseId: string;

  @ManyToOne(() => Phase, (phase) => phase.linkedSubContractorPhases, {
    nullable: true,
  })
  @JoinColumn({ name: "linked_contractor_phase_id" })
  linkedContractorPhase: Phase;

  // Sub-contractor phases linked to this contractor phase
  @OneToMany(() => Phase, (phase) => phase.linkedContractorPhase)
  linkedSubContractorPhases: Phase[];

  @OneToMany(() => SubPhase, (subPhase) => subPhase.phase, {
    cascade: true,
    eager: true,
  })
  subPhases: SubPhase[];

  // Financial summary moved to PhaseFinancialSummary table
  @OneToOne(() => PhaseFinancialSummary, (summary) => summary.phase, {
    cascade: true,
  })
  financialSummary: PhaseFinancialSummary;
}
