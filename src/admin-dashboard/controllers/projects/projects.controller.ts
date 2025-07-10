import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { ProjectsService } from "../../../projects/projects.service";
import { CreateProjectDto } from "../../../projects/dto/create-project.dto";
import { UpdateProjectDto } from "../../../projects/dto/update-project.dto";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../../auth/guards/roles.guard";
import { Roles } from "../../../auth/decorators/roles.decorator";
import { UserRole } from "../../../entities/user.entity";

@Controller("admin/projects")
@UseGuards(JwtAuthGuard)
export class AdminProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  // 1. Paginated, filterable, searchable list
  @Get()
  async listProjects(
    @Query("search") search: string = "",
    @Query("status") status?: string,
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 20
  ) {
    return this.projectsService.adminList({ search, status, page, limit });
  }

  // 2. Project details with related users/members and activities
  @Get(":id")
  async getProject(@Param("id") id: string) {
    return this.projectsService.adminGetDetails(id);
  }

  // 3. Create project
  @Post()
  async createProject(
    @Body() createProjectDto: CreateProjectDto,
    @Request() req
  ) {
    return this.projectsService.create(createProjectDto, req.user);
  }

  // 4. Update project
  @Put(":id")
  async updateProject(
    @Param("id") id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @Request() req
  ) {
    return this.projectsService.update(id, updateProjectDto, req.user.id);
  }

  // 5. Delete project
  @Delete(":id")
  async deleteProject(@Param("id") id: string, @Request() req) {
    return this.projectsService.remove(id, req.user.id);
  }

  // 6. (Optional) Endpoints for related users, activities, or files can be added here
}
