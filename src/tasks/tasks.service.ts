import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Task, TaskStatus, TaskPriority } from "../entities/task.entity";
import { User } from "../entities/user.entity";
import { Project } from "../entities/project.entity";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { ProjectsService } from "../projects/projects.service";

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    private projectsService: ProjectsService
  ) {}

  async findAllByProject(projectId: string, userId: string): Promise<Task[]> {
    await this.projectsService.findOne(projectId, userId);
    return this.tasksRepository.find({
      where: { project_id: projectId },
      relations: ["assignee", "project"],
    });
  }

  async findAllByUser(userId: string): Promise<Task[]> {
    return this.tasksRepository.find({
      where: { assignee_id: userId },
      relations: ["assignee", "project"],
    });
  }

  async findOne(id: string, userId: string): Promise<Task> {
    const task = await this.tasksRepository.findOne({
      where: { id },
      relations: ["assignee", "project"],
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    await this.projectsService.findOne(task.project_id, userId);
    return task;
  }

  async create(createTaskDto: CreateTaskDto, userId: string): Promise<Task> {
    const project = await this.projectsService.findOne(
      createTaskDto.project_id,
      userId
    );
    const task = this.tasksRepository.create({
      ...createTaskDto,
      project,
    });

    return this.tasksRepository.save(task);
  }

  async update(
    id: string,
    updateTaskDto: UpdateTaskDto,
    userId: string
  ): Promise<Task> {
    const task = await this.findOne(id, userId);
    const project = await this.projectsService.findOne(task.project_id, userId);

    if (project.owner_id !== userId && task.assignee_id !== userId) {
      throw new ForbiddenException(
        "You don't have permission to update this task"
      );
    }

    Object.assign(task, updateTaskDto);
    return this.tasksRepository.save(task);
  }

  async remove(id: string, userId: string): Promise<void> {
    const task = await this.findOne(id, userId);
    const project = await this.projectsService.findOne(task.project_id, userId);

    if (project.owner_id !== userId) {
      throw new ForbiddenException("Only the project owner can delete tasks");
    }

    await this.tasksRepository.remove(task);
  }

  async assignTask(
    taskId: string,
    assigneeId: string,
    userId: string
  ): Promise<Task> {
    const task = await this.findOne(taskId, userId);
    const project = await this.projectsService.findOne(task.project_id, userId);

    if (project.owner_id !== userId) {
      throw new ForbiddenException("Only the project owner can assign tasks");
    }

    task.assignee_id = assigneeId;
    return this.tasksRepository.save(task);
  }
}
