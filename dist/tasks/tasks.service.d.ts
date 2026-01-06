import { Repository } from "typeorm";
import { Task } from "../entities/task.entity";
import { Project } from "../entities/project.entity";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { ProjectsService } from "../projects/projects.service";
import { UsersService } from "../users/users.service";
export declare class TasksService {
    private tasksRepository;
    private projectsRepository;
    private readonly projectsService;
    private readonly usersService;
    constructor(tasksRepository: Repository<Task>, projectsRepository: Repository<Project>, projectsService: ProjectsService, usersService: UsersService);
    findAllByProject(projectId: string, userId: string): Promise<Task[]>;
    findAllByUser(userId: string): Promise<Task[]>;
    findOne(id: string, userId: string): Promise<Task>;
    create(createTaskDto: CreateTaskDto, userId: string): Promise<Task>;
    update(id: string, updateTaskDto: UpdateTaskDto, userId: string): Promise<Task>;
    remove(id: string, userId: string): Promise<void>;
    assignTask(taskId: string, assigneeId: string, userId: string): Promise<Task>;
}
