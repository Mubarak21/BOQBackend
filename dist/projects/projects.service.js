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
exports.ProjectsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const project_entity_1 = require("../entities/project.entity");
const task_entity_1 = require("../entities/task.entity");
const XLSX = require("xlsx");
const activities_service_1 = require("../activities/activities.service");
const users_service_1 = require("../users/users.service");
let ProjectsService = class ProjectsService {
    constructor(projectsRepository, tasksRepository, usersService, activitiesService) {
        this.projectsRepository = projectsRepository;
        this.tasksRepository = tasksRepository;
        this.usersService = usersService;
        this.activitiesService = activitiesService;
    }
    async findAll(userId) {
        return this.projectsRepository.find({
            where: [{ owner_id: userId }, { collaborators: { id: userId } }],
            relations: ["owner", "collaborators", "phases", "phases.assignee"],
        });
    }
    async findOne(id, userId) {
        const project = await this.projectsRepository.findOne({
            where: { id },
            relations: [
                "owner",
                "collaborators",
                "phases",
                "phases.assignee",
                "phases.parent_phase",
                "phases.sub_phases",
                "phases.sub_phases.assignee",
            ],
        });
        if (!project) {
            throw new common_1.NotFoundException(`Project with ID ${id} not found`);
        }
        if (userId &&
            project.owner_id !== userId &&
            !project.collaborators.some((c) => c.id === userId)) {
            throw new common_1.ForbiddenException("You don't have access to this project");
        }
        project.phases.sort((a, b) => a.created_at.getTime() - b.created_at.getTime());
        return project;
    }
    async create(createProjectDto, owner) {
        const project = this.projectsRepository.create({
            title: createProjectDto.title,
            description: createProjectDto.description,
            status: createProjectDto.status,
            priority: createProjectDto.priority,
            start_date: createProjectDto.start_date
                ? new Date(createProjectDto.start_date)
                : null,
            end_date: createProjectDto.end_date
                ? new Date(createProjectDto.end_date)
                : null,
            tags: createProjectDto.tags,
            owner_id: owner.id,
        });
        if (createProjectDto.collaborator_ids?.length) {
            const collaborators = await Promise.all(createProjectDto.collaborator_ids.map((id) => this.usersService.findOne(id)));
            project.collaborators = collaborators;
        }
        const savedProject = await this.projectsRepository.save(project);
        await this.activitiesService.logProjectCreated(owner, savedProject);
        return this.findOne(savedProject.id);
    }
    async update(id, updateProjectDto, userId) {
        const project = await this.findOne(id);
        if (project.owner_id !== userId) {
            throw new common_1.ForbiddenException("Only the project owner can update the project");
        }
        Object.assign(project, updateProjectDto);
        return this.projectsRepository.save(project);
    }
    async remove(id, userId) {
        const project = await this.findOne(id);
        if (project.owner_id !== userId) {
            throw new common_1.ForbiddenException("Only the project owner can delete the project");
        }
        await this.projectsRepository.remove(project);
    }
    async addCollaborator(projectId, collaborator, userId) {
        const project = await this.findOne(projectId);
        if (project.owner_id !== userId) {
            throw new common_1.ForbiddenException("Only the project owner can add collaborators");
        }
        if (!project.collaborators) {
            project.collaborators = [];
        }
        if (project.collaborators.some((c) => c.id === collaborator.id)) {
            throw new common_1.ForbiddenException("User is already a collaborator");
        }
        project.collaborators.push(collaborator);
        return this.projectsRepository.save(project);
    }
    async removeCollaborator(projectId, collaboratorId, userId) {
        const project = await this.findOne(projectId);
        if (project.owner_id !== userId) {
            throw new common_1.ForbiddenException("Only the project owner can remove collaborators");
        }
        project.collaborators = project.collaborators.filter((c) => c.id !== collaboratorId);
        return this.projectsRepository.save(project);
    }
    parseAmount(value) {
        if (typeof value === "number")
            return value;
        if (!value)
            return 0;
        return Number(value.toString().replace(/[^0-9.-]+/g, ""));
    }
    async processBoqFile(projectId, file, userId) {
        console.log("\n=== BOQ File Processing Started ===");
        console.log(`File Name: ${file.originalname}`);
        console.log(`File Size: ${file.size} bytes`);
        console.log(`File Type: ${file.mimetype}`);
        const project = await this.findOne(projectId, userId);
        console.log(`\nProcessing BOQ for Project: ${project.title} (ID: ${project.id})`);
        try {
            const workbook = XLSX.read(file.buffer, { type: "buffer" });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(worksheet);
            console.log("\n=== BOQ Data Analysis ===");
            console.log(`Total Rows in BOQ: ${data.length}`);
            const totalRow = data.find((row) => row["Description"]?.toLowerCase().includes("total") ||
                row["Description"]?.toLowerCase().includes("sum"));
            let totalAmount = 0;
            if (totalRow) {
                totalAmount = this.parseAmount(totalRow["Amount"]);
                console.log(`\nFound Total Row:`);
                console.log(`Description: ${totalRow["Description"]}`);
                console.log(`Amount: ${totalAmount}`);
            }
            else {
                totalAmount = data.reduce((sum, row) => sum + this.parseAmount(row["Amount"]), 0);
                console.log(`\nNo Total Row Found - Calculated Total: ${totalAmount}`);
            }
            const taskData = data.filter((row) => row["Description"] &&
                !row["Description"].toLowerCase().includes("total") &&
                !row["Description"].toLowerCase().includes("sum"));
            console.log(`\n=== Task Creation ===`);
            console.log(`Number of Tasks to Create: ${taskData.length}`);
            const tasks = [];
            for (const row of taskData) {
                const description = row["Description"] || "";
                const unit = row["Unit"] || "";
                const quantity = this.parseAmount(row["Quantity"] || row["Qty"]);
                const price = this.parseAmount(row["Price"] || row["Unit Price"]);
                const task = {
                    description,
                    unit,
                    quantity,
                    price,
                    project: { id: projectId },
                };
                tasks.push(task);
                console.log(`Created Task: ${description} (${quantity} ${unit} @ ${price})`);
            }
            const savedTasks = await this.tasksRepository.save(tasks);
            console.log(`\n=== Task Creation Complete ===`);
            console.log(`Successfully Created ${savedTasks.length} Tasks`);
            project.total_amount = totalAmount;
            await this.projectsRepository.save(project);
            console.log(`\nUpdated Project Total Amount: ${totalAmount}`);
            await this.activitiesService.logBoqUploaded(project.owner, project, file.originalname, savedTasks.length, totalAmount);
            console.log("\n=== BOQ Processing Complete ===");
            return {
                message: `Successfully processed BOQ file and created ${savedTasks.length} tasks`,
                totalAmount,
                tasks: savedTasks,
            };
        }
        catch (error) {
            console.error("\n=== BOQ Processing Error ===");
            console.error("Error processing BOQ file:", error);
            throw new common_1.BadRequestException(`Failed to process BOQ file: ${error.message}`);
        }
    }
    async createPhase(projectId, createPhaseDto, userId) {
        const project = await this.findOne(projectId, userId);
        if (createPhaseDto.parent_phase_id) {
            const parentPhase = await this.tasksRepository.findOne({
                where: { id: createPhaseDto.parent_phase_id, project_id: projectId },
            });
            if (!parentPhase) {
                throw new common_1.NotFoundException("Parent phase not found");
            }
        }
        if (createPhaseDto.assignee_id) {
            const assignee = await this.usersService.findOne(createPhaseDto.assignee_id);
            if (!assignee) {
                throw new common_1.NotFoundException("Assignee not found");
            }
        }
        const phase = this.tasksRepository.create({
            ...createPhaseDto,
            project_id: projectId,
            start_date: createPhaseDto.start_date
                ? new Date(createPhaseDto.start_date)
                : null,
            end_date: createPhaseDto.end_date
                ? new Date(createPhaseDto.end_date)
                : null,
            spent: 0,
            progress: 0,
            status: createPhaseDto.status || TaskStatus.NOT_STARTED,
            priority: createPhaseDto.priority || TaskPriority.MEDIUM,
        });
        const savedPhase = await this.tasksRepository.save(phase);
        await this.activitiesService.logPhaseCreated(project.owner, project, savedPhase, await this.tasksRepository.count({ where: { project_id: projectId } }), await this.tasksRepository.count({ where: { project_id: projectId } }));
        return this.tasksRepository.findOne({
            where: { id: savedPhase.id },
            relations: ["assignee", "parent_phase", "sub_phases"],
        });
    }
    async getProjectPhases(projectId, userId) {
        await this.findOne(projectId, userId);
        return this.tasksRepository.find({
            where: { project_id: projectId },
            relations: ["assignee", "parent_phase", "sub_phases"],
            order: {
                created_at: "ASC",
            },
        });
    }
    async getAvailableAssignees() {
        return this.usersService.findAll();
    }
    async updatePhase(projectId, phaseId, updatePhaseDto, userId) {
        const project = await this.findOne(projectId, userId);
        const phase = await this.tasksRepository.findOne({
            where: { id: phaseId, project_id: projectId },
            relations: ["assignee", "parent_phase", "sub_phases"],
        });
        if (!phase) {
            throw new common_1.NotFoundException("Phase not found");
        }
        if (updatePhaseDto.parent_phase_id) {
            const parentPhase = await this.tasksRepository.findOne({
                where: { id: updatePhaseDto.parent_phase_id, project_id: projectId },
            });
            if (!parentPhase) {
                throw new common_1.NotFoundException("Parent phase not found");
            }
            if (updatePhaseDto.parent_phase_id === phaseId) {
                throw new common_1.BadRequestException("A phase cannot be its own parent");
            }
        }
        if (updatePhaseDto.assignee_id) {
            const assignee = await this.usersService.findOne(updatePhaseDto.assignee_id);
            if (!assignee) {
                throw new common_1.NotFoundException("Assignee not found");
            }
        }
        const oldBudget = phase.budget;
        const oldProgress = phase.progress;
        const updatedPhase = await this.tasksRepository.save({
            ...phase,
            ...updatePhaseDto,
            start_date: updatePhaseDto.start_date
                ? new Date(updatePhaseDto.start_date)
                : phase.start_date,
            end_date: updatePhaseDto.end_date
                ? new Date(updatePhaseDto.end_date)
                : phase.end_date,
            due_date: updatePhaseDto.due_date
                ? new Date(updatePhaseDto.due_date)
                : phase.due_date,
        });
        if (updatePhaseDto.budget && updatePhaseDto.budget !== oldBudget) {
            await this.activitiesService.logPhaseBudgetUpdate(project.owner, project, updatedPhase, await this.tasksRepository.count({ where: { project_id: projectId } }), await this.tasksRepository.count({ where: { project_id: projectId } }), oldBudget, updatePhaseDto.budget);
        }
        if (updatePhaseDto.progress && updatePhaseDto.progress !== oldProgress) {
            await this.activitiesService.logPhaseProgress(project.owner, project, updatedPhase, await this.tasksRepository.count({ where: { project_id: projectId } }), await this.tasksRepository.count({ where: { project_id: projectId } }), updatePhaseDto.progress);
        }
        return this.tasksRepository.findOne({
            where: { id: updatedPhase.id },
            relations: ["assignee", "parent_phase", "sub_phases"],
        });
    }
    async deletePhase(projectId, phaseId, userId) {
        const project = await this.findOne(projectId, userId);
        const phase = await this.tasksRepository.findOne({
            where: { id: phaseId, project_id: projectId },
            relations: ["sub_phases"],
        });
        if (!phase) {
            throw new common_1.NotFoundException("Phase not found");
        }
        if (phase.sub_phases && phase.sub_phases.length > 0) {
            throw new common_1.BadRequestException("Cannot delete phase with sub-phases. Please delete or reassign sub-phases first.");
        }
        await this.tasksRepository.remove(phase);
        await this.activitiesService.logPhaseDeleted(project.owner, project, phase, await this.tasksRepository.count({ where: { project_id: projectId } }), await this.tasksRepository.count({ where: { project_id: projectId } }));
    }
};
exports.ProjectsService = ProjectsService;
exports.ProjectsService = ProjectsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __param(1, (0, typeorm_1.InjectRepository)(task_entity_1.Task)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        users_service_1.UsersService,
        activities_service_1.ActivitiesService])
], ProjectsService);
//# sourceMappingURL=projects.service.js.map