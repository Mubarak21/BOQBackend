import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
  JoinColumn,
} from "typeorm";
import { User } from "./user.entity";
import { Task } from "./task.entity";
import { Comment } from "./comment.entity";
import { Phase } from "./phase.entity";

export enum ProjectStatus {
  PLANNING = "planning",
  IN_PROGRESS = "in_progress",
  ON_HOLD = "on_hold",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum ProjectPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent",
}

@Entity()
export class Project {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: "enum",
    enum: ProjectStatus,
    default: ProjectStatus.PLANNING,
  })
  status: ProjectStatus;

  @Column({
    type: "enum",
    enum: ProjectPriority,
    default: ProjectPriority.MEDIUM,
  })
  priority: ProjectPriority;

  @Column({ type: "timestamp", nullable: true })
  start_date: Date;

  @Column({ type: "timestamp", nullable: true })
  end_date: Date;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  total_amount: number;

  @Column({ type: "bytea", nullable: true })
  boq_file: Buffer;

  @Column({ nullable: true })
  boq_filename: string;

  @Column({ nullable: true })
  boq_mimetype: string;

  @Column()
  owner_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "owner_id" })
  owner: User;

  @ManyToMany(() => User)
  @JoinTable({
    name: "project_collaborators",
    joinColumn: { name: "project_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "user_id", referencedColumnName: "id" },
  })
  collaborators: User[];

  @OneToMany(() => Phase, (phase) => phase.project)
  phases: Phase[];

  @OneToMany(() => Task, (task) => task.project)
  tasks: Task[];

  @Column("text", { array: true, default: [] })
  tags: string[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Comment, (comment) => comment.project)
  comments: Comment[];
}
