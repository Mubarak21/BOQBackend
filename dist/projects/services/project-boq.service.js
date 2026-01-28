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
const project_boq_entity_1 = require("../../entities/project-boq.entity");
const boq_parser_service_1 = require("../boq-parser.service");
const activities_service_1 = require("../../activities/activities.service");
const projects_service_1 = require("../projects.service");
const project_phase_service_1 = require("./project-phase.service");
const path = require("path");
const fs = require("fs");
const stream_1 = require("stream");
let ProjectBoqService = class ProjectBoqService {
    constructor(projectsRepository, phasesRepository, projectBoqRepository, boqParserService, activitiesService, projectsService, projectPhaseService, dataSource) {
        this.projectsRepository = projectsRepository;
        this.phasesRepository = phasesRepository;
        this.projectBoqRepository = projectBoqRepository;
        this.boqParserService = boqParserService;
        this.activitiesService = activitiesService;
        this.projectsService = projectsService;
        this.projectPhaseService = projectPhaseService;
        this.dataSource = dataSource;
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
    async processBoqFileFromParsedData(projectId, data, totalAmount, userId, fileName, file, type) {
        if (!projectId || projectId.trim() === "") {
            throw new common_1.BadRequestException("Project ID is required to process BOQ file");
        }
        const project = await this.projectsService.findOne(projectId, userId);
        if (!project || !project.id) {
            throw new common_1.NotFoundException(`Project with ID ${projectId} not found`);
        }
        const boqType = type === 'sub_contractor' ? project_boq_entity_1.BOQType.SUB_CONTRACTOR : project_boq_entity_1.BOQType.CONTRACTOR;
        if (boqType === project_boq_entity_1.BOQType.SUB_CONTRACTOR) {
            const contractorBoq = await this.projectBoqRepository.findOne({
                where: {
                    project_id: projectId,
                    type: project_boq_entity_1.BOQType.CONTRACTOR,
                    status: project_boq_entity_1.BOQStatus.PROCESSED,
                },
            });
            if (!contractorBoq) {
                throw new common_1.BadRequestException("Contractor BOQ must be processed before uploading sub-contractor BOQ");
            }
        }
        const existingBoq = await this.projectBoqRepository.findOne({
            where: {
                project_id: projectId,
                type: boqType,
            },
        });
        let filePath = null;
        let oldFilePath = null;
        if (file?.buffer) {
            const uploadsDir = path.join(process.cwd(), 'uploads', 'boqs');
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }
            const fileExtension = path.extname(file.originalname);
            const uniqueFileName = `${projectId}-${boqType}-${Date.now()}${fileExtension}`;
            filePath = path.join(uploadsDir, uniqueFileName);
            fs.writeFileSync(filePath, file.buffer);
            if (existingBoq?.file_path) {
                oldFilePath = existingBoq.file_path;
            }
        }
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        let boqRecord = null;
        try {
            if (existingBoq) {
                boqRecord = existingBoq;
                boqRecord.status = project_boq_entity_1.BOQStatus.PROCESSING;
                if (filePath) {
                    boqRecord.file_path = filePath;
                    boqRecord.file_name = file?.originalname || fileName || null;
                    boqRecord.file_mimetype = file?.mimetype || null;
                    boqRecord.file_size = file?.size || null;
                }
                await queryRunner.manager.save(project_boq_entity_1.ProjectBoq, boqRecord);
            }
            else {
                boqRecord = queryRunner.manager.create(project_boq_entity_1.ProjectBoq, {
                    project_id: projectId,
                    type: boqType,
                    status: project_boq_entity_1.BOQStatus.PROCESSING,
                    file_path: filePath,
                    file_name: file?.originalname || fileName || null,
                    file_mimetype: file?.mimetype || null,
                    file_size: file?.size || null,
                    uploaded_by: userId,
                });
                await queryRunner.manager.save(project_boq_entity_1.ProjectBoq, boqRecord);
            }
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
            const boqTypeString = boqType === project_boq_entity_1.BOQType.SUB_CONTRACTOR ? 'sub_contractor' : 'contractor';
            const createdPhases = await this.projectPhaseService.createPhasesFromBoqData(dataWithUnits, projectId, userId, boqTypeString);
            for (const phase of createdPhases) {
                if (!phase.project_id || phase.project_id !== projectId) {
                    throw new Error(`Phase ${phase.id} was created without valid project_id`);
                }
            }
            const projectToUpdate = await queryRunner.manager.findOne(project_entity_1.Project, {
                where: { id: project.id },
            });
            if (!projectToUpdate) {
                throw new common_1.NotFoundException(`Project with ID ${project.id} not found`);
            }
            projectToUpdate.totalAmount = totalAmount;
            await queryRunner.manager.save(project_entity_1.Project, projectToUpdate);
            boqRecord.status = project_boq_entity_1.BOQStatus.PROCESSED;
            boqRecord.total_amount = totalAmount;
            boqRecord.phases_count = createdPhases.length;
            boqRecord.error_message = null;
            await queryRunner.manager.save(project_boq_entity_1.ProjectBoq, boqRecord);
            await queryRunner.commitTransaction();
            if (oldFilePath && fs.existsSync(oldFilePath)) {
                try {
                    fs.unlinkSync(oldFilePath);
                }
                catch (error) {
                }
            }
            try {
                await this.activitiesService.logBoqUploaded(project.owner, project, fileName || "BOQ File", createdPhases.length, totalAmount);
            }
            catch (error) {
                console.error('Failed to log BOQ upload activity:', error);
            }
            return {
                message: `Successfully processed ${boqType} BOQ file and created ${createdPhases.length} phases from rows with Unit column filled.`,
                totalAmount,
                tasks: [],
            };
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            if (filePath && fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                }
                catch (fileError) {
                    console.error('Failed to clean up file:', fileError);
                }
            }
            try {
                if (boqRecord?.id) {
                    const errorBoqRecord = await this.projectBoqRepository.findOne({
                        where: { id: boqRecord.id },
                    });
                    if (errorBoqRecord) {
                        errorBoqRecord.status = project_boq_entity_1.BOQStatus.FAILED;
                        errorBoqRecord.error_message = error.message;
                        await this.projectBoqRepository.save(errorBoqRecord);
                    }
                }
            }
            catch (updateError) {
                console.error('Failed to update BOQ error status:', updateError);
            }
            throw new common_1.BadRequestException(`Failed to process BOQ data: ${error.message}`);
        }
        finally {
            await queryRunner.release();
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
    async getMissingBoqItems(projectId, userId, boqType) {
        await this.projectsService.findOne(projectId, userId);
        const whereClause = { project_id: projectId };
        if (boqType) {
            whereClause.type = boqType;
        }
        const boqRecord = await this.projectBoqRepository.findOne({
            where: whereClause,
            order: { created_at: 'DESC' },
        });
        if (!boqRecord || !boqRecord.file_path) {
            throw new common_1.NotFoundException("BOQ file not found for this project");
        }
        const filePath = boqRecord.file_path;
        if (!fs.existsSync(filePath)) {
            throw new common_1.NotFoundException("BOQ file not found on server");
        }
        const fileBuffer = fs.readFileSync(filePath);
        const file = {
            buffer: fileBuffer,
            originalname: boqRecord.file_name || 'boq.xlsx',
            mimetype: boqRecord.file_mimetype || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            size: boqRecord.file_size || fileBuffer.length,
            fieldname: 'file',
            encoding: '7bit',
            destination: '',
            filename: boqRecord.file_name || 'boq.xlsx',
            path: filePath,
            stream: stream_1.Readable.from(fileBuffer),
        };
        const parseResult = await this.boqParserService.parseBoqFile(file);
        const existingPhases = await this.phasesRepository.find({
            where: {
                project_id: projectId,
                from_boq: true,
                boqType: boqType || undefined,
            },
        });
        const existingPhaseDescriptions = new Set(existingPhases.map(p => (p.title || p.description || '').toLowerCase().trim()));
        const missingItems = parseResult.items.filter((item) => {
            const itemDescription = (item.description || '').toLowerCase().trim();
            return !existingPhaseDescriptions.has(itemDescription);
        });
        return {
            items: missingItems.map((item) => ({
                description: item.description,
                unit: item.unit,
                quantity: item.quantity,
                rate: item.rate,
                amount: item.amount,
                section: item.section,
                subSection: item.subSection,
                rowIndex: item.rowIndex,
            })),
            totalAmount: missingItems.reduce((sum, item) => sum + item.amount, 0),
        };
    }
};
exports.ProjectBoqService = ProjectBoqService;
exports.ProjectBoqService = ProjectBoqService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __param(1, (0, typeorm_1.InjectRepository)(phase_entity_1.Phase)),
    __param(2, (0, typeorm_1.InjectRepository)(project_boq_entity_1.ProjectBoq)),
    __param(4, (0, common_1.Inject)((0, common_1.forwardRef)(() => activities_service_1.ActivitiesService))),
    __param(5, (0, common_1.Inject)((0, common_1.forwardRef)(() => projects_service_1.ProjectsService))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        boq_parser_service_1.BoqParserService,
        activities_service_1.ActivitiesService,
        projects_service_1.ProjectsService,
        project_phase_service_1.ProjectPhaseService,
        typeorm_2.DataSource])
], ProjectBoqService);
//# sourceMappingURL=project-boq.service.js.map