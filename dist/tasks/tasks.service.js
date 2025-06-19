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
const projects_service_1 = require("../projects/projects.service");
let TasksService = class TasksService {
    constructor(tasksRepository, projectsService) {
        this.tasksRepository = tasksRepository;
        this.projectsService = projectsService;
    }
    async findAllByProject(projectId, userId) {
        await this.projectsService.findOne(projectId, userId);
        return this.tasksRepository.find({
            where: { project_id: projectId },
            relations: ["assignee", "project"],
        });
    }
    async findAllByUser(userId) {
        return this.tasksRepository.find({
            where: { assignee_id: userId },
            relations: ["assignee", "project"],
        });
    }
    async findOne(id, userId) {
        const task = await this.tasksRepository.findOne({
            where: { id },
            relations: ["assignee", "project"],
        });
        if (!task) {
            throw new common_1.NotFoundException(`Task with ID ${id} not found`);
        }
        await this.projectsService.findOne(task.project_id, userId);
        return task;
    }
    async create(createTaskDto, userId) {
        const project = await this.projectsService.findOne(createTaskDto.project_id, userId);
        const task = this.tasksRepository.create({
            ...createTaskDto,
            project,
        });
        return this.tasksRepository.save(task);
    }
    async update(id, updateTaskDto, userId) {
        const task = await this.findOne(id, userId);
        const project = await this.projectsService.findOne(task.project_id, userId);
        if (project.owner_id !== userId && task.assignee_id !== userId) {
            throw new common_1.ForbiddenException("You don't have permission to update this task");
        }
        Object.assign(task, updateTaskDto);
        return this.tasksRepository.save(task);
    }
    async remove(id, userId) {
        const task = await this.findOne(id, userId);
        const project = await this.projectsService.findOne(task.project_id, userId);
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
        task.assignee_id = assigneeId;
        return this.tasksRepository.save(task);
    }
};
exports.TasksService = TasksService;
exports.TasksService = TasksService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(task_entity_1.Task)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        projects_service_1.ProjectsService])
], TasksService);
//# sourceMappingURL=tasks.service.js.map