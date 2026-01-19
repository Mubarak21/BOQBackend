import {
  Injectable,
  NotFoundException,
  BadRequestException,
  forwardRef,
  Inject,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Project } from "../../entities/project.entity";
import { Phase } from "../../entities/phase.entity";
import { BoqParserService } from "../boq-parser.service";
import { ActivitiesService } from "../../activities/activities.service";
import { ProjectsService } from "../projects.service";
import { ProjectPhaseService } from "./project-phase.service";

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
    private readonly boqParserService: BoqParserService,
    @Inject(forwardRef(() => ActivitiesService))
    private readonly activitiesService: ActivitiesService,
    @Inject(forwardRef(() => ProjectsService))
    private readonly projectsService: ProjectsService,
    private readonly projectPhaseService: ProjectPhaseService
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
    fileName?: string
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

    try {
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

      const createdPhases = await this.projectPhaseService.createPhasesFromBoqData(
        dataWithUnits,
        projectId,
        userId
      );

      for (const phase of createdPhases) {
        if (!phase.project_id || phase.project_id !== projectId) {
          throw new Error(
            `Phase ${phase.id} was created without valid project_id`
          );
        }
      }

      const projectToUpdate = await this.projectsRepository.findOne({
        where: { id: project.id },
      });

      if (!projectToUpdate) {
        throw new NotFoundException(`Project with ID ${project.id} not found`);
      }

      projectToUpdate.totalAmount = totalAmount;
      await this.projectsRepository.save(projectToUpdate);

      try {
        await this.activitiesService.logBoqUploaded(
          project.owner,
          project,
          fileName || "BOQ File",
          createdPhases.length,
          totalAmount
        );
      } catch (error) {
        // Failed to log BOQ upload activity
      }

      return {
        message: `Successfully processed BOQ file and created ${createdPhases.length} phases from rows with Unit column filled.`,
        totalAmount,
        tasks: [],
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to process BOQ data: ${error.message}`
      );
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
}


