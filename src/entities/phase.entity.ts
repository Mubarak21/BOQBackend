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

@Entity()
export class Phase {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: "timestamp", nullable: true })
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

  @ManyToOne(() => Project, (project) => project.phases)
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
}
