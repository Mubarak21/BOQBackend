import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from "typeorm";
import { User } from "./user.entity";
import { Project } from "./project.entity";

@Entity("daily_attendance")
@Unique(["project_id", "attendance_date"])
export class DailyAttendance {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "project_id" })
  project_id: string;

  @ManyToOne(() => Project, { onDelete: "CASCADE" })
  @JoinColumn({ name: "project_id" })
  project: Project;

  @Column({ name: "recorded_by" })
  recorded_by: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "recorded_by" })
  recordedByUser: User;

  @Column({ type: "date", name: "attendance_date" })
  attendance_date: string;

  @Column({ type: "int", name: "workers_present", default: 0 })
  workers_present: number;

  @Column({ type: "text", nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: "created_at" })
  created_at: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at: Date;
}
