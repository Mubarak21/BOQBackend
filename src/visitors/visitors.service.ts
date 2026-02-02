import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Visitor, VisitorPriority } from "../entities/visitor.entity";
import { Project } from "../entities/project.entity";
import { User, UserRole } from "../entities/user.entity";
import { CreateVisitorDto } from "./dto/create-visitor.dto";
import { UpdateVisitorDto } from "./dto/update-visitor.dto";

@Injectable()
export class VisitorsService {
  constructor(
    @InjectRepository(Visitor)
    private visitorRepository: Repository<Visitor>,
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

  /** Only contractors and sub-contractors can add visitors; consultants can only view. */
  private canAddVisitor(user: User): boolean {
    return this.isContractorOrSubContractor(user);
  }

  async create(projectId: string, dto: CreateVisitorDto, user: User): Promise<Visitor> {
    if (!this.canAddVisitor(user)) {
      throw new ForbiddenException("Only contractors and sub-contractors can record site visitors");
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

    const dateStr = dto.visit_date.split("T")[0];
    const entity = this.visitorRepository.create({
      project_id: projectId,
      recorded_by: user.id,
      visitor_name: dto.visitor_name,
      company: dto.company ?? null,
      visit_date: dateStr,
      priority: dto.priority ?? VisitorPriority.MEDIUM,
      purpose: dto.purpose ?? null,
    });
    return this.visitorRepository.save(entity);
  }

  async findByProject(projectId: string, user: User): Promise<Visitor[]> {
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

    return this.visitorRepository.find({
      where: { project_id: projectId },
      relations: ["recordedByUser"],
      order: { visit_date: "DESC", created_at: "DESC" },
    });
  }

  async findOne(id: string, user: User): Promise<Visitor> {
    const visitor = await this.visitorRepository.findOne({
      where: { id },
      relations: ["project", "recordedByUser", "project.collaborators"],
    });
    if (!visitor) {
      throw new NotFoundException("Visitor record not found");
    }
    const project = visitor.project;
    if (!this.isConsultant(user) && !this.hasProjectAccess(project, user.id)) {
      throw new ForbiddenException("You do not have access to this visitor record");
    }
    return visitor;
  }

  async update(id: string, dto: UpdateVisitorDto, user: User): Promise<Visitor> {
    if (!this.canAddVisitor(user)) {
      throw new ForbiddenException("Only contractors and sub-contractors can edit site visitors");
    }
    const visitor = await this.findOne(id, user);
    if (dto.visit_date) visitor.visit_date = dto.visit_date.split("T")[0];
    if (dto.visitor_name !== undefined) visitor.visitor_name = dto.visitor_name;
    if (dto.company !== undefined) visitor.company = dto.company ?? null;
    if (dto.priority !== undefined) visitor.priority = dto.priority;
    if (dto.purpose !== undefined) visitor.purpose = dto.purpose ?? null;
    return this.visitorRepository.save(visitor);
  }

  async remove(id: string, user: User): Promise<void> {
    if (!this.canAddVisitor(user)) {
      throw new ForbiddenException("Only contractors and sub-contractors can remove site visitors");
    }
    const visitor = await this.findOne(id, user);
    await this.visitorRepository.remove(visitor);
  }
}
