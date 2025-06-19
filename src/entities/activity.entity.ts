import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./user.entity";
import { Project } from "./project.entity";
import { Task } from "./task.entity";

export enum ActivityType {
  PROJECT_CREATED = "project_created",
  PROJECT_UPDATED = "project_updated",
  PROJECT_DELETED = "project_deleted",
  TASK_CREATED = "task_created",
  TASK_UPDATED = "task_updated",
  TASK_DELETED = "task_deleted",
  TASK_COMPLETED = "task_completed",
  TASK_REOPENED = "task_reopened",
  PHASE_COMPLETED = "phase_completed",
  PHASE_REOPENED = "phase_reopened",
  SCHEDULE_DELAY = "schedule_delay",
  BOQ_UPLOADED = "boq_uploaded",
  COMMENT_ADDED = "comment_added",
  COLLABORATOR_ADDED = "collaborator_added",
  COLLABORATOR_REMOVED = "collaborator_removed",
}

@Entity()
export class Activity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({
    type: "enum",
    enum: ActivityType,
  })
  type: ActivityType;

  @Column()
  description: string;

  @Column({ nullable: true })
  metadata: string; // JSON string for additional data

  @Column()
  user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column()
  project_id: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: "project_id" })
  project: Project;

  @Column({ nullable: true })
  task_id: string;

  @ManyToOne(() => Task, { nullable: true })
  @JoinColumn({ name: "task_id" })
  task: Task;

  @CreateDateColumn()
  created_at: Date;
}
