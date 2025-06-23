import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Project } from "./project.entity";
import { Task } from "./task.entity";
import { User } from "./user.entity";

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

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  estimated_hours: number;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  budget: number;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  spent: number;

  @Column({ type: "decimal", precision: 5, scale: 2, nullable: true })
  progress: number;

  @Column({ nullable: true })
  status: string;

  @Column({ nullable: true })
  assignee_id: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "assignee_id" })
  assignee: User;

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

  @ManyToOne(() => Phase, (phase) => phase.sub_phases, { nullable: true })
  @JoinColumn({ name: "parent_phase_id" })
  parent_phase: Phase;

  @OneToMany(() => Phase, (phase) => phase.parent_phase)
  sub_phases: Phase[];

  @Column({ nullable: true })
  parent_phase_id: string;

  @Column({ nullable: true })
  work_description: string;

  @Column({ nullable: true })
  deliverables: string;

  @Column({ nullable: true })
  requirements: string;

  @Column({ nullable: true })
  risks: string;

  @Column({ nullable: true })
  dependencies: string;

  @Column({ nullable: true })
  priority: string;

  @Column({ type: "timestamp", nullable: true })
  due_date: Date;

  @Column({ nullable: true })
  reference_task_id: string;
}
