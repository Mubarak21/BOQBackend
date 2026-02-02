import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Accident, AccidentSeverity, AccidentStatus } from "../entities/accident.entity";
import { Project } from "../entities/project.entity";
import { User, UserRole } from "../entities/user.entity";
import { CreateAccidentDto } from "./dto/create-accident.dto";
import { UpdateAccidentDto } from "./dto/update-accident.dto";

@Injectable()
export class AccidentsService {
  constructor(
    @InjectRepository(Accident)
    private accidentRepository: Repository<Accident>,
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
  ) {}

  private hasProjectAccess(project: Project, userId: string): boolean {
    return (
      project.owner_id === userId ||
      (project.collaborators || []).some((c) => c.id === userId) ||
      false
    );
  }

  private isConsultant(user: User): boolean {
    return user.role?.toLowerCase() === UserRole.CONSULTANT.toLowerCase();
  }

  private isContractorOrSubContractor(user: User): boolean {
    const r = user.role?.toLowerCase();
    return r === UserRole.CONTRACTOR.toLowerCase() || r === UserRole.SUB_CONTRACTOR.toLowerCase();
  }

  async create(projectId: string, dto: CreateAccidentDto, user: User): Promise<Accident> {
    if (!this.isContractorOrSubContractor(user)) {
      throw new ForbiddenException("Only contractors and sub-contractors can report accidents");
    }

    const project = await this.projectsRepository.findOne({
      where: { id: projectId },
      relations: ["collaborators"],
    });
    if (!project) {
      throw new NotFoundException("Project not found");
    }
    if (!this.hasProjectAccess(project, user.id)) {
      throw new ForbiddenException("You do not have access to this project");
    }

    const dateStr = dto.accident_date.split("T")[0];
    const entity = this.accidentRepository.create({
      project_id: projectId,
      reported_by: user.id,
      accident_date: dateStr,
      description: dto.description,
      severity: dto.severity,
      location: dto.location ?? null,
      injured_count: dto.injured_count ?? 0,
      action_taken: dto.action_taken ?? null,
      status: AccidentStatus.REPORTED,
    });
    return this.accidentRepository.save(entity);
  }

  async findByProject(projectId: string, user: User): Promise<Accident[]> {
    const project = await this.projectsRepository.findOne({
      where: { id: projectId },
      relations: ["collaborators"],
    });
    if (!project) {
      throw new NotFoundException("Project not found");
    }
    if (!this.isConsultant(user) && !this.hasProjectAccess(project, user.id)) {
      throw new ForbiddenException("You do not have access to this project");
    }

    return this.accidentRepository.find({
      where: { project_id: projectId },
      relations: ["reportedByUser"],
      order: { accident_date: "DESC", created_at: "DESC" },
    });
  }

  async findOne(id: string, user: User): Promise<Accident> {
    const accident = await this.accidentRepository.findOne({
      where: { id },
      relations: ["project", "reportedByUser", "project.collaborators"],
    });
    if (!accident) {
      throw new NotFoundException("Accident report not found");
    }
    const project = accident.project;
    if (!this.isConsultant(user) && !this.hasProjectAccess(project, user.id)) {
      throw new ForbiddenException("You do not have access to this accident report");
    }
    return accident;
  }

  async update(id: string, dto: UpdateAccidentDto, user: User): Promise<Accident> {
    const accident = await this.findOne(id, user);
    if (dto.status !== undefined) {
      accident.status = dto.status;
    }
    if (dto.action_taken !== undefined) {
      accident.action_taken = dto.action_taken;
    }
    return this.accidentRepository.save(accident);
  }
}
