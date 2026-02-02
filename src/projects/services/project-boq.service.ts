import {
  Injectable,
  NotFoundException,
  BadRequestException,
  forwardRef,
  Inject,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In, DataSource } from "typeorm";
import { Project } from "../../entities/project.entity";
import { Phase } from "../../entities/phase.entity";
import { ProjectBoq, BOQType, BOQStatus } from "../../entities/project-boq.entity";
import { BoqParserService } from "../boq-parser.service";
import { ActivitiesService } from "../../activities/activities.service";
import { ProjectsService } from "../projects.service";
import { ProjectPhaseService } from "./project-phase.service";
import * as path from "path";
import * as fs from "fs";
import { Readable } from "stream";

export interface ProcessBoqResult {
  message: string;
  totalAmount: number;
  tasks: any[];
}

@Injectable()
export class ProjectBoqService {
  constructor(
    @InjectRepository(Project)
    private readonly projectsRepository: Repository<Project>,
    @InjectRepository(Phase)
    private readonly phasesRepository: Repository<Phase>,
    @InjectRepository(ProjectBoq)
    private readonly projectBoqRepository: Repository<ProjectBoq>,
    private readonly boqParserService: BoqParserService,
    @Inject(forwardRef(() => ActivitiesService))
    private readonly activitiesService: ActivitiesService,
    @Inject(forwardRef(() => ProjectsService))
    private readonly projectsService: ProjectsService,
    private readonly projectPhaseService: ProjectPhaseService,
    private readonly dataSource: DataSource
  ) {}

  async processBoqFile(
    projectId: string,
    file: Express.Multer.File,
    userId: string
  ): Promise<ProcessBoqResult> {
    const project = await this.projectsService.findOne(projectId, userId);

    if (!file?.buffer) {
      throw new BadRequestException("No file uploaded or file buffer missing");
    }

    try {
      const parseResult = await this.boqParserService.parseBoqFile(file);

      return this.processBoqFileFromParsedData(
        projectId,
        parseResult.items,
        parseResult.totalAmount,
        userId,
        file.originalname
      );
    } catch (error) {
      const existingPhases = await this.phasesRepository.find({
        where: { project_id: projectId },
      });

      if (existingPhases.length > 0) {
        return {
          message: `BOQ file processed with warnings. Created ${existingPhases.length} phases.`,
          totalAmount:
            (await this.projectsService.findOne(projectId, userId))
              .totalAmount || 0,
          tasks: [],
        };
      }

      throw new BadRequestException(
        `Failed to process BOQ file: ${error.message}`
      );
    }
  }

  async processBoqFileFromParsedData(
    projectId: string,
    data: any[],
    totalAmount: number,
    userId: string,
    fileName?: string,
    file?: Express.Multer.File,
    type?: 'contractor' | 'sub_contractor'
  ): Promise<ProcessBoqResult> {
    if (!projectId || projectId.trim() === "") {
      throw new BadRequestException(
        "Project ID is required to process BOQ file"
      );
    }

    const project = await this.projectsService.findOne(projectId, userId);

    if (!project || !project.id) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    // Determine BOQ type - default to contractor if not specified
    const boqType: BOQType = type === 'sub_contractor' ? BOQType.SUB_CONTRACTOR : BOQType.CONTRACTOR;

    // Validate: If uploading sub-contractor BOQ, contractor BOQ must be processed first
    if (boqType === BOQType.SUB_CONTRACTOR) {
      const contractorBoq = await this.projectBoqRepository.findOne({
        where: {
          project_id: projectId,
          type: BOQType.CONTRACTOR,
          status: BOQStatus.PROCESSED,
        },
      });

      if (!contractorBoq) {
        throw new BadRequestException(
          "Contractor BOQ must be processed before uploading sub-contractor BOQ"
        );
      }
    }

    // Check if BOQ of this type already exists
    const existingBoq = await this.projectBoqRepository.findOne({
      where: {
        project_id: projectId,
        type: boqType,
      },
    });

    // Save file if provided (file operations outside transaction)
    let filePath: string | null = null;
    let oldFilePath: string | null = null;
    if (file?.buffer) {
      const uploadsDir = path.join(process.cwd(), 'uploads', 'boqs');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const fileExtension = path.extname(file.originalname);
      const uniqueFileName = `${projectId}-${boqType}-${Date.now()}${fileExtension}`;
      filePath = path.join(uploadsDir, uniqueFileName);
      fs.writeFileSync(filePath, file.buffer);
      
      // Store old file path for cleanup if transaction fails
      if (existingBoq?.file_path) {
        oldFilePath = existingBoq.file_path;
      }
    }

    // Use QueryRunner for transaction management
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    // Declare boqRecord outside try block for use in catch
    let boqRecord: ProjectBoq | null = null;

    try {
      // Create or update BOQ record
      if (existingBoq) {
        boqRecord = existingBoq;
        boqRecord.status = BOQStatus.PROCESSING;
        if (filePath) {
          boqRecord.file_path = filePath;
          boqRecord.file_name = file?.originalname || fileName || null;
          boqRecord.file_mimetype = file?.mimetype || null;
          boqRecord.file_size = file?.size || null;
        }
        await queryRunner.manager.save(ProjectBoq, boqRecord);
      } else {
        boqRecord = queryRunner.manager.create(ProjectBoq, {
          project_id: projectId,
          type: boqType,
          status: BOQStatus.PROCESSING,
          file_path: filePath,
          file_name: file?.originalname || fileName || null,
          file_mimetype: file?.mimetype || null,
          file_size: file?.size || null,
          uploaded_by: userId,
        });
        await queryRunner.manager.save(ProjectBoq, boqRecord);
      }
      const dataWithUnits = data.filter((row) => {
        const unit =
          row.unit ||
          row.Unit ||
          row._extractedUnit ||
          (row.rawData && (row.rawData.unit || row.rawData.Unit)) ||
          "";

        const quantity =
          row.quantity !== undefined
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
              : parseFloat(
                  String(row.rawData.quantity || row.rawData.Quantity || 0)
                )
            : 0;

        const unitStr = String(unit || "").trim();
        const hasUnit = unitStr && unitStr !== "" && unitStr !== "No";
        const hasQuantity = quantity && quantity > 0;

        return hasUnit && hasQuantity;
      });

      if (!projectId || projectId !== project.id) {
        throw new BadRequestException(
          "Project ID mismatch when creating phases"
        );
      }

      // Convert BOQType enum to string for phase creation
      const boqTypeString = boqType === BOQType.SUB_CONTRACTOR ? 'sub_contractor' : 'contractor';
      
      // Note: createPhasesFromBoqData already uses its own transaction
      // This is acceptable as nested transactions are handled by the database
      const createdPhases = await this.projectPhaseService.createPhasesFromBoqData(
        dataWithUnits,
        projectId,
        userId,
        boqTypeString
      );

      // Validate phases were created correctly
      for (const phase of createdPhases) {
        if (!phase.project_id || phase.project_id !== projectId) {
          throw new Error(
            `Phase ${phase.id} was created without valid project_id`
          );
        }
      }

      // Keep project totalAmount as set at creation (from consultant's form) - do not overwrite with BOQ-extracted amount
      const projectToUpdate = await queryRunner.manager.findOne(Project, {
        where: { id: project.id },
      });

      if (!projectToUpdate) {
        throw new NotFoundException(`Project with ID ${project.id} not found`);
      }

      const projectTotalAmount = Number(project.totalAmount ?? projectToUpdate.totalAmount ?? 0);
      if (projectTotalAmount > 0) {
        projectToUpdate.totalAmount = projectTotalAmount;
        await queryRunner.manager.save(Project, projectToUpdate);
      }

      // Update BOQ record with success status; use project total (not extracted from BOQ)
      boqRecord.status = BOQStatus.PROCESSED;
      boqRecord.total_amount = projectTotalAmount > 0 ? projectTotalAmount : totalAmount;
      boqRecord.phases_count = createdPhases.length;
      boqRecord.error_message = null;
      await queryRunner.manager.save(ProjectBoq, boqRecord);

      await queryRunner.commitTransaction();
      
      // Delete old file after successful transaction
      if (oldFilePath && fs.existsSync(oldFilePath)) {
        try {
          fs.unlinkSync(oldFilePath);
        } catch (error) {
          // Ignore file deletion errors
        }
      }

      // Log activity outside transaction (use project total, not BOQ-extracted)
      const amountForLog = projectTotalAmount > 0 ? projectTotalAmount : totalAmount;
      try {
        await this.activitiesService.logBoqUploaded(
          project.owner,
          project,
          fileName || "BOQ File",
          createdPhases.length,
          amountForLog
        );
      } catch (error) {
        // Failed to log BOQ upload activity - don't fail the operation
        console.error('Failed to log BOQ upload activity:', error);
      }

      return {
        message: `Successfully processed ${boqType} BOQ file and created ${createdPhases.length} phases from rows with Unit column filled.`,
        totalAmount: amountForLog,
        tasks: [],
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      
      // Clean up file if created
      if (filePath && fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (fileError) {
          console.error('Failed to clean up file:', fileError);
        }
      }
      
      // Update BOQ record with error status (outside transaction)
      try {
        if (boqRecord?.id) {
          const errorBoqRecord = await this.projectBoqRepository.findOne({
            where: { id: boqRecord.id },
          });
          if (errorBoqRecord) {
            errorBoqRecord.status = BOQStatus.FAILED;
            errorBoqRecord.error_message = error.message;
            await this.projectBoqRepository.save(errorBoqRecord);
          }
        }
      } catch (updateError) {
        console.error('Failed to update BOQ error status:', updateError);
      }
      
      throw new BadRequestException(
        `Failed to process BOQ data: ${error.message}`
      );
    } finally {
      await queryRunner.release();
    }
  }

  async previewBoqFile(file: Express.Multer.File): Promise<{
    phases: Array<{
      title: string;
      description: string;
      budget: number;
      unit?: string;
      quantity?: number;
      rate?: number;
      mainSection?: string;
      subSection?: string;
    }>;
    totalAmount: number;
    totalPhases: number;
  }> {
    if (!file?.buffer) {
      throw new BadRequestException("No file uploaded or file buffer missing");
    }

    const parseResult = await this.boqParserService.parseBoqFile(file);

    const phases = parseResult.items.map((item) => {
      const descParts: string[] = [];
      if (item.section) descParts.push(`Section: ${item.section}`);
      descParts.push(`Unit: ${item.unit}`);
      descParts.push(`Quantity: ${item.quantity}`);
      if (item.rate > 0) descParts.push(`Rate: ${item.rate}`);

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

  /**
   * Get BOQ items that weren't converted to phases
   * This reads the BOQ file and compares with existing phases to find missing items
   */
  async getMissingBoqItems(projectId: string, userId: string, boqType?: 'contractor' | 'sub_contractor'): Promise<{
    items: Array<{
      description: string;
      unit: string;
      quantity: number;
      rate: number;
      amount: number;
      section?: string;
      subSection?: string;
      rowIndex: number;
    }>;
    totalAmount: number;
  }> {
    // Verify user has access to project
    await this.projectsService.findOne(projectId, userId);

    // Get the BOQ record
    const whereClause: any = { project_id: projectId };
    if (boqType) {
      whereClause.type = boqType;
    }

    const boqRecord = await this.projectBoqRepository.findOne({
      where: whereClause,
      order: { created_at: 'DESC' },
    });

    if (!boqRecord || !boqRecord.file_path) {
      throw new NotFoundException("BOQ file not found for this project");
    }

    // Read and parse the BOQ file
    const filePath = boqRecord.file_path;
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException("BOQ file not found on server");
    }

    const fileBuffer = fs.readFileSync(filePath);
    const file: Express.Multer.File = {
      buffer: fileBuffer,
      originalname: boqRecord.file_name || 'boq.xlsx',
      mimetype: boqRecord.file_mimetype || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      size: boqRecord.file_size || fileBuffer.length,
      fieldname: 'file',
      encoding: '7bit',
      destination: '',
      filename: boqRecord.file_name || 'boq.xlsx',
      path: filePath,
      stream: Readable.from(fileBuffer),
    };

    // Parse the BOQ file
    const parseResult = await this.boqParserService.parseBoqFile(file);

    // Get all phases created from this BOQ (both active and inactive)
    const existingPhases = await this.phasesRepository.find({
      where: {
        project_id: projectId,
        from_boq: true,
        boqType: boqType || undefined,
      },
    });

    // Create a set of phase titles/descriptions that already exist
    const existingPhaseDescriptions = new Set(
      existingPhases.map(p => (p.title || p.description || '').toLowerCase().trim())
    );

    // Filter out items that already have phases created
    // Compare by description (case-insensitive)
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
}


