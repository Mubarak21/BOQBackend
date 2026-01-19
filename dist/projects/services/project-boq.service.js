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
exports.ProjectBoqService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const project_entity_1 = require("../../entities/project.entity");
const phase_entity_1 = require("../../entities/phase.entity");
const boq_parser_service_1 = require("../boq-parser.service");
const activities_service_1 = require("../../activities/activities.service");
const projects_service_1 = require("../projects.service");
const project_phase_service_1 = require("./project-phase.service");
let ProjectBoqService = class ProjectBoqService {
    constructor(projectsRepository, phasesRepository, boqParserService, activitiesService, projectsService, projectPhaseService) {
        this.projectsRepository = projectsRepository;
        this.phasesRepository = phasesRepository;
        this.boqParserService = boqParserService;
        this.activitiesService = activitiesService;
        this.projectsService = projectsService;
        this.projectPhaseService = projectPhaseService;
    }
    async processBoqFile(projectId, file, userId) {
        const project = await this.projectsService.findOne(projectId, userId);
        if (!file?.buffer) {
            throw new common_1.BadRequestException("No file uploaded or file buffer missing");
        }
        try {
            const parseResult = await this.boqParserService.parseBoqFile(file);
            return this.processBoqFileFromParsedData(projectId, parseResult.items, parseResult.totalAmount, userId, file.originalname);
        }
        catch (error) {
            const existingPhases = await this.phasesRepository.find({
                where: { project_id: projectId },
            });
            if (existingPhases.length > 0) {
                return {
                    message: `BOQ file processed with warnings. Created ${existingPhases.length} phases.`,
                    totalAmount: (await this.projectsService.findOne(projectId, userId))
                        .totalAmount || 0,
                    tasks: [],
                };
            }
            throw new common_1.BadRequestException(`Failed to process BOQ file: ${error.message}`);
        }
    }
    async processBoqFileFromParsedData(projectId, data, totalAmount, userId, fileName) {
        if (!projectId || projectId.trim() === "") {
            throw new common_1.BadRequestException("Project ID is required to process BOQ file");
        }
        const project = await this.projectsService.findOne(projectId, userId);
        if (!project || !project.id) {
            throw new common_1.NotFoundException(`Project with ID ${projectId} not found`);
        }
        try {
            const dataWithUnits = data.filter((row) => {
                const unit = row.unit ||
                    row.Unit ||
                    row._extractedUnit ||
                    (row.rawData && (row.rawData.unit || row.rawData.Unit)) ||
                    "";
                const quantity = row.quantity !== undefined
                    ? row.quantity
                    : row.Quantity !== undefined
                        ? row.Quantity
                        : row._extractedQuantity !== undefined
                            ? row._extractedQuantity
                            : row.rawData && (row.rawData.quantity || row.rawData.Quantity)
                                ? typeof row.rawData.quantity === "number"
                                    ? row.rawData.quantity
                                    : typeof row.rawData.Quantity === "number"
                                        ? row.rawData.Quantity
                                        : parseFloat(String(row.rawData.quantity || row.rawData.Quantity || 0))
                                : 0;
                const unitStr = String(unit || "").trim();
                const hasUnit = unitStr && unitStr !== "" && unitStr !== "No";
                const hasQuantity = quantity && quantity > 0;
                return hasUnit && hasQuantity;
            });
            if (!projectId || projectId !== project.id) {
                throw new common_1.BadRequestException("Project ID mismatch when creating phases");
            }
            const createdPhases = await this.projectPhaseService.createPhasesFromBoqData(dataWithUnits, projectId, userId);
            for (const phase of createdPhases) {
                if (!phase.project_id || phase.project_id !== projectId) {
                    throw new Error(`Phase ${phase.id} was created without valid project_id`);
                }
            }
            const projectToUpdate = await this.projectsRepository.findOne({
                where: { id: project.id },
            });
            if (!projectToUpdate) {
                throw new common_1.NotFoundException(`Project with ID ${project.id} not found`);
            }
            projectToUpdate.totalAmount = totalAmount;
            await this.projectsRepository.save(projectToUpdate);
            try {
                await this.activitiesService.logBoqUploaded(project.owner, project, fileName || "BOQ File", createdPhases.length, totalAmount);
            }
            catch (error) {
            }
            return {
                message: `Successfully processed BOQ file and created ${createdPhases.length} phases from rows with Unit column filled.`,
                totalAmount,
                tasks: [],
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(`Failed to process BOQ data: ${error.message}`);
        }
    }
    async previewBoqFile(file) {
        if (!file?.buffer) {
            throw new common_1.BadRequestException("No file uploaded or file buffer missing");
        }
        const parseResult = await this.boqParserService.parseBoqFile(file);
        const phases = parseResult.items.map((item) => {
            const descParts = [];
            if (item.section)
                descParts.push(`Section: ${item.section}`);
            descParts.push(`Unit: ${item.unit}`);
            descParts.push(`Quantity: ${item.quantity}`);
            if (item.rate > 0)
                descParts.push(`Rate: ${item.rate}`);
            return {
                title: item.description,
                description: descParts.join(" | "),
                budget: item.amount || 0,
                unit: item.unit,
                quantity: item.quantity,
                rate: item.rate > 0 ? item.rate : undefined,
                mainSection: item.section || undefined,
                subSection: item.subSection || undefined,
            };
        });
        return {
            phases,
            totalAmount: parseResult.totalAmount,
            totalPhases: phases.length,
        };
    }
};
exports.ProjectBoqService = ProjectBoqService;
exports.ProjectBoqService = ProjectBoqService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __param(1, (0, typeorm_1.InjectRepository)(phase_entity_1.Phase)),
    __param(3, (0, common_1.Inject)((0, common_1.forwardRef)(() => activities_service_1.ActivitiesService))),
    __param(4, (0, common_1.Inject)((0, common_1.forwardRef)(() => projects_service_1.ProjectsService))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        boq_parser_service_1.BoqParserService,
        activities_service_1.ActivitiesService,
        projects_service_1.ProjectsService,
        project_phase_service_1.ProjectPhaseService])
], ProjectBoqService);
//# sourceMappingURL=project-boq.service.js.map