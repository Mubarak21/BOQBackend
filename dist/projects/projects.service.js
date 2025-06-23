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
const phase_entity_1 = require("../entities/phase.entity");
const tasks_service_1 = require("../tasks/tasks.service");
const project_access_service_1 = require("./services/project-access.service");
function normalizeColumnName(name) {
    return name.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
}
let ProjectsService = class ProjectsService {
    constructor(projectsRepository, tasksRepository, phasesRepository, usersService, activitiesService, tasksService, projectAccessService) {
        this.projectsRepository = projectsRepository;
        this.tasksRepository = tasksRepository;
        this.phasesRepository = phasesRepository;
        this.usersService = usersService;
        this.activitiesService = activitiesService;
        this.tasksService = tasksService;
        this.projectAccessService = projectAccessService;
    }
    async findAll(userId, all = false) {
        let projects;
        if (all) {
            projects = await this.projectsRepository.find({
                relations: ["owner", "collaborators", "phases"],
            });
        }
        else {
            projects = await this.projectsRepository.find({
                where: [{ owner_id: userId }, { collaborators: { id: userId } }],
                relations: ["owner", "collaborators", "phases"],
            });
        }
        return Promise.all(projects.map((p) => this.getProjectResponse(p, userId)));
    }
    async findOne(id, userId) {
        if (!id) {
            throw new common_1.BadRequestException("Project ID is required");
        }
        const project = await this.projectsRepository.findOne({
            where: { id },
            relations: [
                "owner",
                "collaborators",
                "phases",
                "phases.parent_phase",
                "phases.sub_phases",
            ],
        });
        if (!project) {
            throw new common_1.NotFoundException(`Project with ID ${id} not found`);
        }
        if (userId && !this.hasProjectAccess(project, userId)) {
            throw new common_1.ForbiddenException("You don't have access to this project");
        }
        if (project.phases?.length > 0) {
            project.phases.sort((a, b) => a.created_at.getTime() - b.created_at.getTime());
        }
        return project;
    }
    async create(createProjectDto, owner) {
        if (!owner?.id) {
            throw new common_1.BadRequestException("Owner is required");
        }
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
            total_amount: createProjectDto.totalAmount ?? 0,
        });
        if (createProjectDto.collaborator_ids?.length) {
            const collaborators = await this.getValidatedCollaborators(createProjectDto.collaborator_ids);
            project.collaborators = collaborators;
        }
        const savedProject = await this.projectsRepository.save(project);
        try {
            await this.activitiesService.logProjectCreated(owner, savedProject, null);
        }
        catch (error) {
            console.warn("Failed to log project creation activity:", error);
        }
        return this.findOne(savedProject.id);
    }
    async update(id, updateProjectDto, userId) {
        const project = await this.findOne(id);
        if (project.owner_id !== userId) {
            throw new common_1.ForbiddenException("Only the project owner can update the project");
        }
        if (updateProjectDto.collaborator_ids) {
            const collaborators = await this.getValidatedCollaborators(updateProjectDto.collaborator_ids);
            project.collaborators = collaborators;
        }
        const updateData = {
            ...updateProjectDto,
            start_date: updateProjectDto.start_date
                ? new Date(updateProjectDto.start_date)
                : project.start_date,
            end_date: updateProjectDto.end_date
                ? new Date(updateProjectDto.end_date)
                : project.end_date,
        };
        Object.assign(project, updateData);
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
        this.projectAccessService.validateCollaboratorOperation({
            project,
            collaborator,
            userId,
        });
        if (!project.collaborators) {
            project.collaborators = [];
        }
        project.collaborators.push(collaborator);
        await this.activitiesService.logCollaboratorAdded(collaborator, project, collaborator);
        return this.projectsRepository.save(project);
    }
    async removeCollaborator(projectId, collaboratorId, userId) {
        const project = await this.findOne(projectId);
        if (project.owner_id !== userId) {
            throw new common_1.ForbiddenException("Only the project owner can remove collaborators");
        }
        const initialLength = project.collaborators?.length || 0;
        project.collaborators =
            project.collaborators?.filter((c) => c.id !== collaboratorId) || [];
        if (project.collaborators.length === initialLength) {
            throw new common_1.NotFoundException("Collaborator not found in project");
        }
        return this.projectsRepository.save(project);
    }
    async processBoqFile(projectId, file, userId) {
        console.log("\n=== BOQ File Processing Started ===");
        console.log(`File Name: ${file.originalname}`);
        console.log(`File Size: ${file.size} bytes`);
        console.log(`File Type: ${file.mimetype}`);
        const project = await this.findOne(projectId, userId);
        console.log(`\nProcessing BOQ for Project: ${project.title} (ID: ${project.id})`);
        if (!file?.buffer) {
            throw new common_1.BadRequestException("No file uploaded or file buffer missing");
        }
        try {
            const { data, totalAmount } = await this.parseBoqFile(file);
            const tasks = await this.createTasksFromBoqData(data, projectId);
            project.total_amount = totalAmount;
            await this.projectsRepository.save(project);
            try {
                await this.activitiesService.logBoqUploaded(project.owner, project, file.originalname, tasks.length, totalAmount);
            }
            catch (error) {
                console.warn("Failed to log BOQ upload activity:", error);
            }
            console.log("\n=== BOQ Processing Complete ===");
            return {
                message: `Successfully processed BOQ file and created ${tasks.length} tasks`,
                totalAmount,
                tasks,
            };
        }
        catch (error) {
            console.error("\n=== BOQ Processing Error ===");
            console.error("Error processing BOQ file:", error);
            throw new common_1.BadRequestException(`Failed to process BOQ file: ${error.message}`);
        }
    }
    async createPhase(projectId, createPhaseDto, userId) {
        await this.findOne(projectId, userId);
        const existingPhase = await this.phasesRepository.findOne({
            where: { project_id: projectId, title: createPhaseDto.title },
        });
        if (existingPhase) {
            throw new common_1.BadRequestException("A phase with this title already exists for this project.");
        }
        if (createPhaseDto.assigneeId) {
            await this.validateAssignee(createPhaseDto.assigneeId);
        }
        const phaseData = {
            title: createPhaseDto.title,
            description: createPhaseDto.description,
            work_description: createPhaseDto.workDescription,
            deliverables: createPhaseDto.deliverables,
            requirements: createPhaseDto.requirements,
            risks: createPhaseDto.risks,
            dependencies: createPhaseDto.dependencies,
            priority: createPhaseDto.priority,
            start_date: createPhaseDto.startDate,
            end_date: createPhaseDto.endDate,
            due_date: createPhaseDto.dueDate,
            estimated_hours: createPhaseDto.estimatedHours,
            budget: createPhaseDto.budget,
            spent: createPhaseDto.spent,
            progress: createPhaseDto.progress,
            status: createPhaseDto.status,
            assignee_id: createPhaseDto.assigneeId || null,
            parent_phase_id: createPhaseDto.parentPhaseId || null,
            reference_task_id: createPhaseDto.referenceTaskId || null,
            project_id: projectId,
        };
        const phase = this.phasesRepository.create(phaseData);
        const savedPhase = await this.phasesRepository.save(phase);
        const phases = await this.phasesRepository.find({
            where: { project_id: projectId },
        });
        const totalAmount = phases.reduce((sum, phase) => sum + (Number(phase.budget) || 0), 0);
        await this.projectsRepository.update(projectId, {
            total_amount: totalAmount,
        });
        if (createPhaseDto.tasks?.length) {
            await this.createTasksRecursive(createPhaseDto.tasks, projectId, savedPhase.id);
        }
        return savedPhase;
    }
    async updatePhase(projectId, phaseId, updatePhaseDto, userId) {
        await this.findOne(projectId, userId);
        const phase = await this.phasesRepository.findOne({
            where: { id: phaseId, project_id: projectId },
        });
        if (!phase) {
            throw new common_1.NotFoundException("Phase not found");
        }
        if (updatePhaseDto.assigneeId) {
            await this.validateAssignee(updatePhaseDto.assigneeId);
        }
        const updateData = {
            title: updatePhaseDto.title,
            description: updatePhaseDto.description,
            work_description: updatePhaseDto.workDescription,
            deliverables: updatePhaseDto.deliverables,
            requirements: updatePhaseDto.requirements,
            risks: updatePhaseDto.risks,
            dependencies: updatePhaseDto.dependencies,
            priority: updatePhaseDto.priority,
            start_date: updatePhaseDto.startDate,
            end_date: updatePhaseDto.endDate,
            due_date: updatePhaseDto.dueDate,
            estimated_hours: updatePhaseDto.estimatedHours,
            budget: updatePhaseDto.budget,
            spent: updatePhaseDto.spent,
            progress: updatePhaseDto.progress,
            status: updatePhaseDto.status,
            assignee_id: updatePhaseDto.assigneeId || null,
            parent_phase_id: updatePhaseDto.parentPhaseId || null,
            reference_task_id: updatePhaseDto.referenceTaskId || null,
        };
        Object.assign(phase, updateData);
        const updatedPhase = await this.phasesRepository.save(phase);
        const phases = await this.phasesRepository.find({
            where: { project_id: projectId },
        });
        const totalAmount = phases.reduce((sum, phase) => sum + (Number(phase.budget) || 0), 0);
        await this.projectsRepository.update(projectId, {
            total_amount: totalAmount,
        });
        if (updatePhaseDto.status === "completed" && phase.status !== "completed") {
            const project = await this.projectsRepository.findOne({
                where: { id: projectId },
            });
            const user = await this.usersService.findOne(userId);
            const allPhases = await this.phasesRepository.find({
                where: { project_id: projectId },
            });
            const phaseNumber = allPhases.findIndex((p) => p.id === phaseId) + 1;
            const totalPhases = allPhases.length;
            await this.activitiesService.logPhaseCompleted(user, project, updatedPhase, phaseNumber, totalPhases);
            if (updatedPhase.end_date &&
                new Date(updatedPhase.end_date) < new Date()) {
                const delayDays = Math.ceil((new Date().getTime() - new Date(updatedPhase.end_date).getTime()) /
                    (1000 * 60 * 60 * 24));
                await this.activitiesService.logPhaseDelay(user, project, updatedPhase, phaseNumber, totalPhases, delayDays);
            }
        }
        return updatedPhase;
    }
    async deletePhase(projectId, phaseId, userId) {
        await this.findOne(projectId, userId);
        const phase = await this.phasesRepository.findOne({
            where: { id: phaseId, project_id: projectId },
        });
        if (!phase) {
            throw new common_1.NotFoundException("Phase not found");
        }
        await this.phasesRepository.remove(phase);
        const phases = await this.phasesRepository.find({
            where: { project_id: projectId },
        });
        const totalAmount = phases.reduce((sum, phase) => sum + (Number(phase.budget) || 0), 0);
        await this.projectsRepository.update(projectId, {
            total_amount: totalAmount,
        });
    }
    async getProjectPhases(projectId, userId) {
        await this.findOne(projectId, userId);
        return this.phasesRepository.find({
            where: { project_id: projectId },
            order: { created_at: "ASC" },
        });
    }
    async getAvailableAssignees(projectId) {
        const project = await this.projectsRepository.findOne({
            where: { id: projectId },
            relations: ["owner", "collaborators"],
        });
        if (!project) {
            throw new common_1.NotFoundException("Project not found");
        }
        return [project.owner, ...(project.collaborators || [])];
    }
    async getProjectResponse(project, userId) {
        const { isOwner, isCollaborator } = this.projectAccessService.checkProjectAccess({ project, userId });
        const phases = project.phases || [];
        const totalPhases = phases.length;
        let progress = 0;
        if (totalPhases > 0) {
            const totalProgress = phases.reduce((sum, phase) => sum + (phase.progress || 0), 0);
            progress = Math.round(totalProgress / totalPhases);
            if (progress > 100)
                progress = 100;
        }
        const completedPhases = phases.filter((phase) => phase.status === "completed").length;
        if (isOwner || isCollaborator) {
            return {
                id: project.id,
                name: project.title,
                description: project.description,
                progress,
                completedPhases,
                totalPhases,
                totalAmount: project.total_amount,
                startDate: project.start_date,
                estimatedCompletion: project.end_date,
                owner: project.owner?.display_name || project.owner_id,
                collaborators: (project.collaborators || []).map((c) => c.display_name || c.id),
                tags: project.tags,
                phases: phases,
                isOwner,
                isCollaborator,
            };
        }
        return {
            id: project.id,
            name: project.title,
            description: project.description,
            progress,
            totalPhases,
            owner: project.owner?.display_name || project.owner_id,
            tags: project.tags,
            isOwner,
            isCollaborator,
        };
    }
    async findAllProjects() {
        return this.projectsRepository.find({
            relations: ["owner", "collaborators", "phases"],
        });
    }
    async joinProject(projectId, user) {
        const project = await this.findOne(projectId);
        if (project.owner_id === user.id) {
            throw new common_1.BadRequestException("Owner cannot join as collaborator");
        }
        if (project.collaborators?.some((c) => c.id === user.id)) {
            throw new common_1.BadRequestException("User is already a collaborator");
        }
        if (!project.collaborators) {
            project.collaborators = [];
        }
        project.collaborators.push(user);
        await this.activitiesService.logCollaboratorAdded(user, project, user);
        return this.projectsRepository.save(project);
    }
    hasProjectAccess(project, userId) {
        return (project.owner_id === userId ||
            project.collaborators?.some((c) => c.id === userId) ||
            false);
    }
    async getValidatedCollaborators(collaboratorIds) {
        const collaborators = await Promise.all(collaboratorIds.map(async (id) => {
            try {
                return await this.usersService.findOne(id);
            }
            catch (error) {
                throw new common_1.BadRequestException(`Collaborator with ID ${id} not found`);
            }
        }));
        return collaborators;
    }
    async validateAssignee(assigneeId) {
        try {
            await this.usersService.findOne(assigneeId);
        }
        catch (error) {
            throw new common_1.NotFoundException("Assignee not found");
        }
    }
    parseAmount(value) {
        if (typeof value === "number")
            return value;
        if (!value)
            return 0;
        const numStr = value.toString().replace(/[^0-9.-]+/g, "");
        const parsed = Number(numStr);
        return isNaN(parsed) ? 0 : parsed;
    }
    async parseBoqFile(file) {
        console.log("[DEBUG] Reading Excel file buffer...");
        const workbook = XLSX.read(file.buffer, { type: "buffer" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        if (!worksheet) {
            throw new common_1.BadRequestException("No worksheet found in uploaded file");
        }
        const data = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        console.log(`[DEBUG] Parsed ${data.length} rows from Excel file`);
        const columnMappings = this.getColumnMappings(worksheet);
        const { descriptionCol, quantityCol, priceCol } = columnMappings;
        const totalRow = data.find((row) => row[descriptionCol]?.toLowerCase().includes("total") ||
            row[descriptionCol]?.toLowerCase().includes("sum"));
        let totalAmount = 0;
        if (totalRow) {
            totalAmount =
                this.parseAmount(totalRow[quantityCol]) ||
                    this.parseAmount(totalRow[priceCol]);
            console.log(`Found total row with amount: ${totalAmount}`);
        }
        else {
            totalAmount = data.reduce((sum, row) => {
                const amount = this.parseAmount(row[quantityCol]) || this.parseAmount(row[priceCol]);
                return sum + amount;
            }, 0);
            console.log(`Calculated total amount: ${totalAmount}`);
        }
        const validData = data.filter((row) => row[descriptionCol] &&
            typeof row[descriptionCol] === "string" &&
            !row[descriptionCol].toLowerCase().includes("total") &&
            !row[descriptionCol].toLowerCase().includes("sum") &&
            row[descriptionCol].trim() !== "");
        return { data: validData, totalAmount };
    }
    getColumnMappings(worksheet) {
        const headerRow = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            range: 0,
            blankrows: false,
        })[0] || [];
        const normalizedMap = {};
        for (const col of headerRow) {
            if (typeof col === "string") {
                normalizedMap[normalizeColumnName(col)] = col;
            }
        }
        const columnSynonyms = {
            description: [
                "description",
                "desc",
                "itemdescription",
                "workdescription",
            ],
            unit: ["unit", "units", "uom"],
            quantity: ["quantity", "qty", "quantities"],
            price: [
                "price",
                "unitprice",
                "rate",
                "amount",
                "totalprice",
                "totalamount",
            ],
        };
        const findColumn = (field) => {
            for (const synonym of columnSynonyms[field]) {
                const norm = normalizeColumnName(synonym);
                if (normalizedMap[norm])
                    return normalizedMap[norm];
            }
            return undefined;
        };
        return {
            descriptionCol: findColumn("description"),
            unitCol: findColumn("unit"),
            quantityCol: findColumn("quantity"),
            priceCol: findColumn("price"),
        };
    }
    async createTasksFromBoqData(data, projectId) {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const columnMappings = this.getColumnMappings(worksheet);
        const { descriptionCol, unitCol, quantityCol, priceCol } = columnMappings;
        const tasks = [];
        console.log(`Creating ${data.length} tasks from BOQ data`);
        for (const row of data) {
            const description = row[descriptionCol] || "";
            const unit = unitCol ? row[unitCol] || "" : "";
            const quantity = this.parseAmount(quantityCol ? row[quantityCol] : undefined);
            const price = this.parseAmount(priceCol ? row[priceCol] : undefined);
            if (description.trim()) {
                const task = this.tasksRepository.create({
                    description: description.trim(),
                    unit: unit.trim(),
                    quantity,
                    price,
                    project: { id: projectId },
                });
                const savedTask = await this.tasksRepository.save(task);
                tasks.push(savedTask);
                console.log(`Created task: ${description} (${quantity} ${unit} @ ${price})`);
            }
        }
        return tasks;
    }
    async createTasksRecursive(tasks, projectId, phaseId, parentTaskId = null) {
        for (const taskDto of tasks) {
            const { subTasks, ...taskData } = taskDto;
            const task = this.tasksRepository.create({
                ...taskData,
                project_id: projectId,
                phase_id: phaseId,
                parent_task_id: parentTaskId,
            });
            const savedTask = await this.tasksRepository.save(task);
            if (subTasks?.length) {
                await this.createTasksRecursive(subTasks, projectId, phaseId, savedTask.id);
            }
        }
    }
};
exports.ProjectsService = ProjectsService;
exports.ProjectsService = ProjectsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __param(1, (0, typeorm_1.InjectRepository)(task_entity_1.Task)),
    __param(2, (0, typeorm_1.InjectRepository)(phase_entity_1.Phase)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        users_service_1.UsersService,
        activities_service_1.ActivitiesService,
        tasks_service_1.TasksService,
        project_access_service_1.ProjectAccessService])
], ProjectsService);
//# sourceMappingURL=projects.service.js.map