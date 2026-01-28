import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  OneToOne,
  JoinTable,
  JoinColumn,
} from "typeorm";
import { User } from "./user.entity";
import { Task } from "./task.entity";
import { Comment } from "./comment.entity";
import { Phase } from "./phase.entity";
import { ContractorPhase } from "./contractor-phase.entity";
import { SubContractorPhase } from "./sub-contractor-phase.entity";
import { Department } from "./department.entity";
import { ProjectFinancialSummary } from "./project-financial-summary.entity";
import { ProjectMetadata } from "./project-metadata.entity";
import { ProjectSettings } from "./project-settings.entity";

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

  @Column({
    type: "decimal",
    precision: 20,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number | string | null | undefined) => {
        // Convert number to string to avoid precision loss and scientific notation
        if (value === null || value === undefined) return "0";
        const numValue = typeof value === "number" ? value : parseFloat(String(value));
        if (isNaN(numValue)) return "0";
        // Use toFixed to ensure proper decimal formatting
        // Ensure value doesn't exceed decimal(20,2) limits
        const MAX_VALUE = 999999999999999999.99;
        const clampedValue = Math.min(Math.max(numValue, -MAX_VALUE), MAX_VALUE);
        return clampedValue.toFixed(2);
      },
      from: (value: string | number | null | undefined) => {
        if (typeof value === "number") return value;
        if (!value) return 0;
        const parsed = parseFloat(String(value));
        return isNaN(parsed) ? 0 : parsed;
      },
    },
  })
  totalAmount: number;

  // Financial fields
  // Financial data moved to ProjectFinancialSummary
  @OneToOne(() => ProjectFinancialSummary, (summary) => summary.project, {
    cascade: true,
  })
  financialSummary: ProjectFinancialSummary;

  // Metadata moved to ProjectMetadata
  @OneToOne(() => ProjectMetadata, (metadata) => metadata.project, {
    cascade: true,
  })
  metadata: ProjectMetadata;

  // Settings moved to ProjectSettings
  @OneToOne(() => ProjectSettings, (settings) => settings.project, {
    cascade: true,
  })
  settings: ProjectSettings;

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

  // Legacy phases (for backward compatibility)
  @OneToMany(() => Phase, (phase) => phase.project)
  phases: Phase[];

  // Contractor phases
  @OneToMany(() => ContractorPhase, (phase) => phase.project)
  contractorPhases: ContractorPhase[];

  // Sub-contractor phases
  @OneToMany(() => SubContractorPhase, (phase) => phase.project)
  subContractorPhases: SubContractorPhase[];

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

  @Column({ nullable: true })
  department_id: string;

  @ManyToOne(() => Department, (department) => department.projects, {
    nullable: true,
  })
  @JoinColumn({ name: "department_id" })
  department: Department;
}
