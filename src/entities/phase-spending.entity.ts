import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Phase } from "./phase.entity";
import { Project } from "./project.entity";

@Entity()
export class PhaseSpending {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  phase_id: string;

  @ManyToOne(() => Phase)
  @JoinColumn({ name: "phase_id" })
  phase: Phase;

  @Column()
  project_id: string;

  @ManyToOne(() => Project, { onDelete: "CASCADE" })
  @JoinColumn({ name: "project_id" })
  project: Project;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  amount: number;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "date", nullable: true })
  date: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
