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

  async create(createPenaltyDto: CreatePenaltyDto, user: User): Promise<Penalty> {
    // Only consultants and admins can assign penalties
    if (user.role !== UserRole.CONSULTANT && user.role !== UserRole.ADMIN) {
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

    const penalty = this.penaltiesRepository.create({
      ...createPenaltyDto,
      assigned_by: user.id,
      status: PenaltyStatus.PENDING,
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
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Only admins can mark penalties as paid");
    }

    penalty.status = PenaltyStatus.PAID;
    penalty.paid_at = new Date();

    return this.penaltiesRepository.save(penalty);
  }
}

