import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from "@nestjs/common";
import { TasksService } from "./tasks.service";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("tasks")
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(@Body() createTaskDto: CreateTaskDto, @Request() req) {
    return this.tasksService.create(createTaskDto, req.user.id);
  }

  @Get()
  findAll(@Query("projectId") projectId: string, @Request() req) {
    if (projectId) {
      return this.tasksService.findAllByProject(projectId, req.user.id);
    }
    return this.tasksService.findAllByUser(req.user.id);
  }

  @Get(":id")
  findOne(@Param("id") id: string, @Request() req) {
    return this.tasksService.findOne(id, req.user.id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Request() req
  ) {
    return this.tasksService.update(id, updateTaskDto, req.user.id);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @Request() req) {
    return this.tasksService.remove(id, req.user.id);
  }

  @Patch(":id/assign/:userId")
  assignTask(
    @Param("id") id: string,
    @Param("userId") userId: string,
    @Request() req
  ) {
    return this.tasksService.assignTask(id, userId, req.user.id);
  }
}
