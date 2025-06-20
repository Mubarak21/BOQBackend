"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const task_entity_1 = require("../entities/task.entity");
const project_entity_1 = require("../entities/project.entity");
const projects_service_1 = require("../projects/projects.service");
let TasksService = class TasksService {
    constructor(tasksRepository, projectsRepository, projectsService) {
        this.tasksRepository = tasksRepository;
        this.projectsRepository = projectsRepository;
        this.projectsService = projectsService;
    }
    async findAllByProject(projectId, userId) {
        await this.projectsRepository.findOne({ where: { id: projectId } });
        return this.tasksRepository.find({
            where: { project: { id: projectId } },
            relations: ["project"],
        });
    }
    async findAllByUser(userId) {
        return this.tasksRepository.find({
            relations: ["project"],
        });
    }
    async findOne(id, userId) {
        const task = await this.tasksRepository.findOne({
            where: { id },
            relations: ["project"],
        });
        if (!task) {
            throw new common_1.NotFoundException(`Task with ID ${id} not found`);
        }
        await this.projectsRepository.findOne({ where: { id: task.project_id } });
        return task;
    }
    async create(createTaskDto, userId) {
        const project = await this.projectsService.findOne(createTaskDto.project_id, userId);
        const createTaskRecursive = async (dto, parentTaskId = null) => {
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
    async update(id, updateTaskDto, userId) {
        const task = await this.findOne(id, userId);
        const project = await this.projectsRepository.findOne({
            where: { id: task.project_id },
        });
        if (project.owner_id !== userId) {
            throw new common_1.ForbiddenException("You don't have permission to update this task");
        }
        Object.assign(task, updateTaskDto);
        return this.tasksRepository.save(task);
    }
    async remove(id, userId) {
        const task = await this.findOne(id, userId);
        const project = await this.projectsRepository.findOne({
            where: { id: task.project_id },
        });
        if (project.owner_id !== userId) {
            throw new common_1.ForbiddenException("Only the project owner can delete tasks");
        }
        await this.tasksRepository.remove(task);
    }
    async assignTask(taskId, assigneeId, userId) {
        const task = await this.findOne(taskId, userId);
        const project = await this.projectsService.findOne(task.project_id, userId);
        if (project.owner_id !== userId) {
            throw new common_1.ForbiddenException("Only the project owner can assign tasks");
        }
        return this.tasksRepository.save(task);
    }
};
exports.TasksService = TasksService;
exports.TasksService = TasksService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(task_entity_1.Task)),
    __param(1, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => projects_service_1.ProjectsService))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        projects_service_1.ProjectsService])
], TasksService);
//# sourceMappingURL=tasks.service.js.map