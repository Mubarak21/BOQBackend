import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { User } from "./user.entity";
import { Project } from "./project.entity";

@Entity()
export class Department {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  name: string;

  @OneToMany(() => User, (user) => user.department)
  users: User[];

  @OneToMany(() => Project, (project) => project.department)
  projects: Project[];
}
