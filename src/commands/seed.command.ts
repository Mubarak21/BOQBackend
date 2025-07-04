import { Command } from "nestjs-command";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User, UserRole } from "../entities/user.entity";
import { Department } from "../entities/department.entity";
import * as bcrypt from "bcrypt";

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>
  ) {}

  async seed() {
    // Seed Departments
    const departments = ["Engineering", "HR", "Finance"];
    for (const name of departments) {
      let dept = await this.departmentRepository.findOne({ where: { name } });
      if (!dept) {
        dept = this.departmentRepository.create({ name });
        await this.departmentRepository.save(dept);
        console.log(`Created department: ${name}`);
      }
    }

    // Seed Users
    const users = [
      {
        email: "admin@example.com",
        password: "admin123",
        display_name: "Admin User",
        role: UserRole.ADMIN,
        department: "Engineering",
      },
      {
        email: "user@example.com",
        password: "user123",
        display_name: "Regular User",
        role: UserRole.USER,
        department: "HR",
      },
    ];
    for (const u of users) {
      let user = await this.userRepository.findOne({
        where: { email: u.email },
      });
      if (!user) {
        const department = await this.departmentRepository.findOne({
          where: { name: u.department },
        });
        const hashedPassword = await bcrypt.hash(u.password, 10);
        user = this.userRepository.create({
          email: u.email,
          password: hashedPassword,
          display_name: u.display_name,
          role: u.role,
          department_id: department?.id,
          notification_preferences: {
            email: true,
            project_updates: true,
            task_updates: true,
          },
        });
        await this.userRepository.save(user);
        console.log(`Created user: ${u.email}`);
      }
    }
    console.log("✅ Seeding complete!");
  }
}

@Injectable()
export class SeedCommand {
  constructor(private readonly seedService: SeedService) {}

  @Command({ command: "seed", describe: "seed the database with initial data" })
  async run() {
    await this.seedService.seed();
  }
}
