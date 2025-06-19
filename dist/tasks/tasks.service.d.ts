import { Repository } from "typeorm";
import { Task } from "../entities/task.entity";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { ProjectsService } from "../projects/projects.service";
export declare class TasksService {
    private tasksRepository;
    private projectsService;
    constructor(tasksRepository: Repository<Task>, projectsService: ProjectsService);
    findAllByProject(projectId: string, userId: string): Promise<Task[]>;
    findAllByUser(userId: string): Promise<Task[]>;
    findOne(id: string, userId: string): Promise<Task>;
    create(createTaskDto: CreateTaskDto, userId: string): Promise<Task>;
    update(id: string, updateTaskDto: UpdateTaskDto, userId: string): Promise<Task>;
    remove(id: string, userId: string): Promise<void>;
    assignTask(taskId: string, assigneeId: string, userId: string): Promise<Task>;
}
