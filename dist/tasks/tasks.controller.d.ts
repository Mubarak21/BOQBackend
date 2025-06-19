import { TasksService } from "./tasks.service";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
export declare class TasksController {
    private readonly tasksService;
    constructor(tasksService: TasksService);
    create(createTaskDto: CreateTaskDto, req: any): Promise<import("../entities/task.entity").Task>;
    findAll(projectId: string, req: any): Promise<import("../entities/task.entity").Task[]>;
    findOne(id: string, req: any): Promise<import("../entities/task.entity").Task>;
    update(id: string, updateTaskDto: UpdateTaskDto, req: any): Promise<import("../entities/task.entity").Task>;
    remove(id: string, req: any): Promise<void>;
    assignTask(id: string, userId: string, req: any): Promise<import("../entities/task.entity").Task>;
}
