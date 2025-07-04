import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  Request,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Department } from "../entities/department.entity";
import { Project } from "../entities/project.entity";
import { User } from "../entities/user.entity";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { Public } from "../auth/decorators/public.decorator";

@Controller("departments")
@UseGuards(JwtAuthGuard)
export class DepartmentsController {
  constructor(
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  @Public()
  @Get()
  async getAllDepartments() {
    return this.departmentRepository.find();
  }

  @Post()
  async createDepartment(@Body() body: { name: string }) {
    let department = await this.departmentRepository.findOne({
      where: { name: body.name },
    });
    if (department) return department;
    department = this.departmentRepository.create({ name: body.name });
    return this.departmentRepository.save(department);
  }

  @Patch(":id")
  async updateDepartment(
    @Param("id") id: string,
    @Body() body: { name: string }
  ) {
    await this.departmentRepository.update(id, { name: body.name });
    return this.departmentRepository.findOne({ where: { id } });
  }

  @Delete(":id")
  async deleteDepartment(@Param("id") id: string) {
    return this.departmentRepository.delete(id);
  }

  @Get("my-projects")
  async getProjectsForMyDepartment(@Request() req) {
    const user = await this.userRepository.findOne({
      where: { id: req.user.id },
    });
    if (!user?.department_id) return [];
    return this.projectRepository.find({
      where: { department_id: user.department_id },
    });
  }
}
