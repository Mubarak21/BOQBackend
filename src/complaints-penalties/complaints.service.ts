import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Complaint, ComplaintStatus } from "../entities/complaint.entity";
import { User, UserRole } from "../entities/user.entity";
import { Project } from "../entities/project.entity";
import { CreateComplaintDto } from "./dto/create-complaint.dto";
import { RespondComplaintDto } from "./dto/respond-complaint.dto";
import { AppealComplaintDto } from "./dto/appeal-complaint.dto";

@Injectable()
export class ComplaintsService {
  constructor(
    @InjectRepository(Complaint)
    private complaintsRepository: Repository<Complaint>,
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>
  ) {}

  async create(createComplaintDto: CreateComplaintDto, user: User): Promise<Complaint> {
    // Consultants, contractors, and sub-contractors can raise complaints
    const allowedRoles = [UserRole.CONSULTANT, UserRole.CONTRACTOR, UserRole.SUB_CONTRACTOR];
    if (!allowedRoles.includes(user.role)) {
      throw new ForbiddenException("Only consultants, contractors, and sub-contractors can raise complaints");
    }

    // Verify project exists
    const project = await this.projectsRepository.findOne({
      where: { id: createComplaintDto.project_id },
    });
    if (!project) {
      throw new NotFoundException("Project not found");
    }

    const complaint = this.complaintsRepository.create({
      ...createComplaintDto,
      raised_by: user.id,
      status: ComplaintStatus.OPEN,
    });

    return this.complaintsRepository.save(complaint);
  }

  async findByProject(projectId: string): Promise<any[]> {
    const complaints = await this.complaintsRepository.find({
      where: { project_id: projectId },
      relations: ["raiser", "responder", "phase", "subPhase"],
      order: { created_at: "DESC" },
    });
    
    return complaints.map(complaint => ({
      id: complaint.id,
      projectId: complaint.project_id,
      phaseId: complaint.phase_id,
      subPhaseId: complaint.sub_phase_id,
      raisedBy: complaint.raised_by,
      raisedByName: complaint.raiser?.display_name || null,
      title: complaint.title,
      description: complaint.description,
      status: complaint.status,
      createdAt: complaint.created_at,
      response: complaint.response,
      appealReason: complaint.appeal_reason,
    }));
  }

  async findOne(id: string): Promise<Complaint> {
    const complaint = await this.complaintsRepository.findOne({
      where: { id },
      relations: ["raiser", "responder", "phase", "subPhase", "project"],
    });
    if (!complaint) {
      throw new NotFoundException(`Complaint with ID ${id} not found`);
    }
    return complaint;
  }

  async respond(
    id: string,
    respondDto: RespondComplaintDto,
    user: User
  ): Promise<Complaint> {
    const complaint = await this.findOne(id);

    // Only contractors and sub_contractors can respond to complaints
    if (user.role !== UserRole.CONTRACTOR && user.role !== UserRole.SUB_CONTRACTOR) {
      throw new ForbiddenException("Only contractors and sub_contractors can respond to complaints");
    }

    // Check if complaint is already resolved
    if (complaint.status === ComplaintStatus.RESOLVED) {
      throw new BadRequestException("Complaint is already resolved");
    }

    complaint.response = respondDto.response;
    complaint.responded_by = user.id;
    complaint.responded_at = new Date();
    complaint.status = ComplaintStatus.RESOLVED;

    return this.complaintsRepository.save(complaint);
  }

  async appeal(
    id: string,
    appealDto: AppealComplaintDto,
    user: User
  ): Promise<Complaint> {
    const complaint = await this.findOne(id);

    // Only contractors and sub_contractors can appeal complaints
    if (user.role !== UserRole.CONTRACTOR && user.role !== UserRole.SUB_CONTRACTOR) {
      throw new ForbiddenException("Only contractors and sub_contractors can appeal complaints");
    }

    // Check if complaint can be appealed
    if (complaint.status === ComplaintStatus.APPEALED) {
      throw new BadRequestException("Complaint is already appealed");
    }

    complaint.appeal_reason = appealDto.reason;
    complaint.appealed_at = new Date();
    complaint.status = ComplaintStatus.APPEALED;

    return this.complaintsRepository.save(complaint);
  }
}

