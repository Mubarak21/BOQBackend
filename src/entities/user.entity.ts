import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
} from "typeorm";
import { Project } from "./project.entity";
import { Task } from "./task.entity";
import { Comment } from "./comment.entity";

export enum UserRole {
  USER = "user",
  ADMIN = "admin",
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

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Project, (project) => project.owner)
  owned_projects: Project[];

  @ManyToMany(() => Project, (project) => project.collaborators)
  collaborating_projects: Project[];

  @OneToMany(() => Task, (task) => task.assignee)
  assigned_tasks: Task[];

  @OneToMany(() => Comment, (comment) => comment.author)
  comments: Comment[];
}
