import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  forwardRef,
  Inject,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Task } from "../entities/task.entity";
import { Project } from "../entities/project.entity";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { ProjectsService } from "../projects/projects.service";
import { UsersService } from "../users/users.service";

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,

    @Inject(forwardRef(() => ProjectsService))
    private readonly projectsService: ProjectsService,
    private readonly usersService: UsersService
  ) {}

  async findAllByProject(projectId: string, userId: string): Promise<Task[]> {
    await this.projectsRepository.findOne({ where: { id: projectId } });
    return this.tasksRepository.find({
      where: { project: { id: projectId } },
      relations: ["project"],
    });
  }

  async findAllByUser(userId: string): Promise<Task[]> {
    // No assignee_id in Task entity anymore; return all tasks or filter as needed
    return this.tasksRepository.find({
      relations: ["project"],
    });
  }

  async findOne(id: string, userId: string): Promise<Task> {
    const task = await this.tasksRepository.findOne({
      where: { id },
      relations: ["project"],
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    await this.projectsRepository.findOne({ where: { id: task.project_id } });
    return task;
  }

  async create(createTaskDto: CreateTaskDto, userId: string): Promise<Task> {
    const project = await this.projectsService.findOne(
      createTaskDto.project_id,
      userId
    );
    // Helper to recursively create tasks and subTasks
    const createTaskRecursive = async (
      dto: CreateTaskDto,
      parentTaskId: string | null = null
    ): Promise<Task> => {
      const { subTasks, ...taskData } = dto;
      const task = this.tasksRepository.create({
        ...taskData,
        project,
        parent_task_id: parentTaskId,
      });
      const savedTask = await this.tasksRepository.save(task);
      if (subTasks && Array.isArray(subTasks) && subTasks.length > 0) {
        for (const subTaskDto of subTasks) {
          await createTaskRecursive(subTaskDto, savedTask.id);
        }
      }
      return savedTask;
    };
    return createTaskRecursive(createTaskDto);
  }

  async update(
    id: string,
    updateTaskDto: UpdateTaskDto,
    userId: string
  ): Promise<Task> {
    const task = await this.findOne(id, userId);
    const project = await this.projectsRepository.findOne({
      where: { id: task.project_id },
    });
    const user = await this.usersService.findOne(userId);
    const isAdmin = user?.role === "consultant";
    const isConsultant = user?.role === "consultant";

    if (project.owner_id !== userId && !isAdmin && !isConsultant) {
      throw new ForbiddenException(
        "You don't have permission to update this task"
      );
    }

    Object.assign(task, updateTaskDto);
    return this.tasksRepository.save(task);
  }

  async remove(id: string, userId: string): Promise<void> {
    const task = await this.findOne(id, userId);
    const project = await this.projectsRepository.findOne({
      where: { id: task.project_id },
    });
    const user = await this.usersService.findOne(userId);
    const isAdmin = user?.role === "consultant";
    const isConsultant = user?.role === "consultant";

    if (project.owner_id !== userId && !isAdmin && !isConsultant) {
      throw new ForbiddenException("Only the project owner, admin, or consultant can delete tasks");
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
    const user = await this.usersService.findOne(userId);
    const isAdmin = user?.role === "consultant";
    const isConsultant = user?.role === "consultant";

    if (project.owner_id !== userId && !isAdmin && !isConsultant) {
      throw new ForbiddenException("Only the project owner, admin, or consultant can assign tasks");
    }

    // Task entity no longer supports assignee_id; assignment removed
    return this.tasksRepository.save(task);
  }
}
