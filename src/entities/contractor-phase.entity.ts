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
import { SubPhase } from "./sub-phase.entity";
import { PhaseFinancialSummary } from "./phase-financial-summary.entity";
import { PhaseStatus } from "./phase.entity";

@Entity("contractor_phases")
export class ContractorPhase {
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
    enum: ["not_started", "in_progress", "completed", "delayed"],
    default: "not_started",
  })
  status: PhaseStatus;

  @ManyToOne(() => Project, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "project_id" })
  project: Project;

  @Column()
  project_id: string;

  @OneToMany(() => Task, (task) => task.contractorPhase)
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

  // Link to sub-contractor phases
  @OneToMany(() => SubPhase, (subPhase) => subPhase.contractorPhase, {
    cascade: true,
    eager: true,
  })
  subPhases: SubPhase[];

  // Sub-contractor phases linked to this contractor phase
  @OneToMany("SubContractorPhase", "linkedContractorPhase")
  linkedSubContractorPhases: any[];

  // Financial summary
  @OneToOne(() => PhaseFinancialSummary, (summary) => summary.contractorPhase, {
    cascade: true,
  })
  financialSummary: PhaseFinancialSummary;
}
