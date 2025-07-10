import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from "typeorm";

@Entity()
export class Stats {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "int", default: 0 })
  total_projects: number;

  @Column({ type: "decimal", precision: 20, scale: 2, default: 0 })
  total_value: string;

  @Column({ type: "int", default: 0 })
  team_members: number;

  @Column({ type: "decimal", precision: 5, scale: 2, default: 0 })
  completion_rate: string;

  @UpdateDateColumn()
  updated_at: Date;
}
