import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Penalty, PenaltyStatus } from "../entities/penalty.entity";
import { User, UserRole } from "../entities/user.entity";
import { Project } from "../entities/project.entity";
import { Complaint } from "../entities/complaint.entity";
import { CreatePenaltyDto } from "./dto/create-penalty.dto";
import { AppealPenaltyDto } from "./dto/appeal-penalty.dto";
import * as path from "path";
import * as fs from "fs";

@Injectable()
export class PenaltiesService {
  constructor(
    @InjectRepository(Penalty)
    private penaltiesRepository: Repository<Penalty>,
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    @InjectRepository(Complaint)
    private complaintsRepository: Repository<Complaint>
  ) {}

  async create(
    createPenaltyDto: CreatePenaltyDto,
    user: User,
    evidenceFile?: Express.Multer.File
  ): Promise<Penalty> {
    // Only consultants and admins can assign penalties
    if (user.role !== UserRole.CONSULTANT) {
      throw new ForbiddenException("Only consultants and admins can assign penalties");
    }

    // Verify project exists
    const project = await this.projectsRepository.findOne({
      where: { id: createPenaltyDto.project_id },
    });
    if (!project) {
      throw new NotFoundException("Project not found");
    }

    // Verify complaint exists if provided
    if (createPenaltyDto.complaint_id) {
      const complaint = await this.complaintsRepository.findOne({
        where: { id: createPenaltyDto.complaint_id },
      });
      if (!complaint) {
        throw new NotFoundException("Complaint not found");
      }
    }

    // Handle evidence image upload (optional)
    let evidenceImageUrl: string | null = null;
    if (evidenceFile) {
      // Validate it's an image
      if (!evidenceFile.mimetype.startsWith("image/")) {
        throw new BadRequestException("Evidence file must be an image (JPEG, PNG, etc.)");
      }

      const uploadDir = path.join(
        process.cwd(),
        "uploads",
        "penalties",
        "evidence"
      );
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const fileName = `${Date.now()}-${evidenceFile.originalname.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, evidenceFile.buffer);
      evidenceImageUrl = `/uploads/penalties/evidence/${fileName}`;
    }

    const penalty = this.penaltiesRepository.create({
      ...createPenaltyDto,
      assigned_by: user.id,
      status: PenaltyStatus.PENDING,
      evidence_image_url: evidenceImageUrl,
    });

    return this.penaltiesRepository.save(penalty);
  }

  async findByProject(projectId: string): Promise<any[]> {
    const penalties = await this.penaltiesRepository.find({
      where: { project_id: projectId },
      relations: ["assignee", "assigner", "complaint", "phase", "project"],
      order: { created_at: "DESC" },
    });
    
    return penalties.map(penalty => ({
      id: penalty.id,
      projectId: penalty.project_id,
      phaseId: penalty.phase_id,
      complaintId: penalty.complaint_id,
      amount: Number(penalty.amount),
      reason: penalty.reason,
      status: penalty.status,
      createdAt: penalty.created_at,
      appealReason: penalty.appeal_reason,
      evidenceImageUrl: penalty.evidence_image_url,
    }));
  }

  async findOne(id: string): Promise<Penalty> {
    const penalty = await this.penaltiesRepository.findOne({
      where: { id },
      relations: ["assignee", "assigner", "complaint", "phase", "project"],
    });
    if (!penalty) {
      throw new NotFoundException(`Penalty with ID ${id} not found`);
    }
    return penalty;
  }

  async appeal(
    id: string,
    appealDto: AppealPenaltyDto,
    user: User
  ): Promise<Penalty> {
    const penalty = await this.findOne(id);

    // Only contractors and sub_contractors can appeal penalties
    if (user.role !== UserRole.CONTRACTOR && user.role !== UserRole.SUB_CONTRACTOR) {
      throw new ForbiddenException("Only contractors and sub_contractors can appeal penalties");
    }

    // Check if penalty is assigned to the user
    if (penalty.assigned_to !== user.id) {
      throw new ForbiddenException("You can only appeal penalties assigned to you");
    }

    // Check if penalty can be appealed
    if (penalty.status === PenaltyStatus.APPEALED) {
      throw new BadRequestException("Penalty is already appealed");
    }

    if (penalty.status === PenaltyStatus.PAID) {
      throw new BadRequestException("Cannot appeal a paid penalty");
    }

    penalty.appeal_reason = appealDto.reason;
    penalty.appealed_at = new Date();
    penalty.status = PenaltyStatus.APPEALED;

    return this.penaltiesRepository.save(penalty);
  }

  async markAsPaid(id: string, user: User): Promise<Penalty> {
    const penalty = await this.findOne(id);

    // Only admins can mark penalties as paid
    if (user.role !== UserRole.CONSULTANT) {
      throw new ForbiddenException("Only admins can mark penalties as paid");
    }

    penalty.status = PenaltyStatus.PAID;
    penalty.paid_at = new Date();

    return this.penaltiesRepository.save(penalty);
  }
}

