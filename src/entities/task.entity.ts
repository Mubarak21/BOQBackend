import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { Project } from "./project.entity";
import { Phase } from "./phase.entity";
import { ContractorPhase } from "./contractor-phase.entity";
import { SubContractorPhase } from "./sub-contractor-phase.entity";

@Entity()
export class Task {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  description: string;

  @Column({ nullable: true })
  unit: string;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  quantity: number;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  price: number;

  @Column()
  project_id: string;

  @ManyToOne(() => Project, (project) => project.tasks, { onDelete: "CASCADE" })
  @JoinColumn({ name: "project_id" })
  project: Project;

  @Column({ nullable: true })
  phase_id: string;

  // Legacy phase relationship (for backward compatibility)
  @ManyToOne(() => Phase, (phase) => phase.tasks, { nullable: true })
  @JoinColumn({ name: "phase_id" })
  phase: Phase;

  // Contractor phase relationship
  @Column({ nullable: true, name: "contractor_phase_id" })
  contractorPhaseId: string;

  @ManyToOne(() => ContractorPhase, (phase) => phase.tasks, { nullable: true })
  @JoinColumn({ name: "contractor_phase_id" })
  contractorPhase: ContractorPhase;

  // Sub-contractor phase relationship
  @Column({ nullable: true, name: "sub_contractor_phase_id" })
  subContractorPhaseId: string;

  @ManyToOne(() => SubContractorPhase, (phase) => phase.tasks, { nullable: true })
  @JoinColumn({ name: "sub_contractor_phase_id" })
  subContractorPhase: SubContractorPhase;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Task, (task) => task.subTasks, { nullable: true })
  @JoinColumn({ name: "parent_task_id" })
  parentTask: Task;

  @OneToMany(() => Task, (task) => task.parentTask)
  subTasks: Task[];

  @Column({ nullable: true })
  parent_task_id: string;
}
