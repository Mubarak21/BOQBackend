import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Project } from "./project.entity";
import { Task } from "./task.entity";
import { Comment } from "./comment.entity";
import { Department } from "./department.entity";

export enum UserRole {
  USER = "user",
  ADMIN = "admin",
  CONSULTANT = "consultant",
  CONTRACTOR = "contractor",
  SUB_CONTRACTOR = "sub_contractor",
  FINANCE = "finance",
}

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  display_name: string;

  @Column({ type: "text", nullable: true })
  bio: string;

  @Column({ nullable: true })
  avatar_url: string;

  @Column({
    type: "enum",
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({
    type: "jsonb",
    default: { email: true, project_updates: true, task_updates: true },
  })
  notification_preferences: {
    email: boolean;
    project_updates: boolean;
    task_updates: boolean;
  };

  @Column({ default: "active" })
  status: string;

  @Column({ nullable: true, type: "timestamp" })
  last_login: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Project, (project) => project.owner)
  owned_projects: Project[];

  @ManyToMany(() => Project, (project) => project.collaborators)
  collaborating_projects: Project[];

  @OneToMany(() => Comment, (comment) => comment.author)
  comments: Comment[];

  @Column({ nullable: true })
  department_id: string;

  @ManyToOne(() => Department, (department) => department.users, {
    nullable: true,
  })
  @JoinColumn({ name: "department_id" })
  department: Department;
}
