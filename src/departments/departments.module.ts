import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DepartmentsController } from "./departments.controller";
import { Department } from "../entities/department.entity";
import { Project } from "../entities/project.entity";
import { User } from "../entities/user.entity";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [TypeOrmModule.forFeature([Department, Project, User]), AuthModule],
  controllers: [DepartmentsController],
})
export class DepartmentsModule {}
