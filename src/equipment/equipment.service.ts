import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Equipment, EquipmentCategory, EquipmentStatus } from "../entities/equipment.entity";
import { Project } from "../entities/project.entity";
import { User, UserRole } from "../entities/user.entity";
import { CreateEquipmentDto } from "./dto/create-equipment.dto";
import { UpdateEquipmentDto } from "./dto/update-equipment.dto";

@Injectable()
export class EquipmentService {
  constructor(
    @InjectRepository(Equipment)
    private equipmentRepository: Repository<Equipment>,
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

  async getProjectsWithEquipmentCount(user: User): Promise<{ id: string; title: string; equipmentCount: number }[]> {
    let projects: Project[];
    if (this.isConsultant(user)) {
      projects = await this.projectsRepository.find({
        relations: ["collaborators"],
        order: { updated_at: "DESC" },
      });
    } else {
      projects = await this.projectsRepository
        .createQueryBuilder("p")
        .leftJoinAndSelect("p.collaborators", "c")
        .where("p.owner_id = :userId", { userId: user.id })
        .orWhere("c.id = :userId", { userId: user.id })
        .orderBy("p.updated_at", "DESC")
        .getMany();
    }
    const counts = await this.equipmentRepository
      .createQueryBuilder("e")
      .select("e.project_id", "project_id")
      .addSelect("COUNT(e.id)", "count")
      .groupBy("e.project_id")
      .getRawMany();
    const countMap = new Map(counts.map((r) => [r.project_id, parseInt(r.count, 10)]));
    return projects.map((p) => ({
      id: p.id,
      title: p.title || "Untitled Project",
      equipmentCount: countMap.get(p.id) || 0,
    }));
  }

  async findByProject(projectId: string, user: User): Promise<Equipment[]> {
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
    return this.equipmentRepository.find({
      where: { project_id: projectId },
      order: { name: "ASC", created_at: "DESC" },
    });
  }

  async create(projectId: string, dto: CreateEquipmentDto, user: User): Promise<Equipment> {
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
    const entity = this.equipmentRepository.create({
      project_id: projectId,
      name: dto.name,
      description: dto.description ?? null,
      quantity: dto.quantity ?? 1,
      category: dto.category ?? EquipmentCategory.OTHER,
      status: dto.status ?? EquipmentStatus.AVAILABLE,
      serial_number: dto.serial_number ?? null,
    });
    return this.equipmentRepository.save(entity);
  }

  async findOne(id: string, user: User): Promise<Equipment> {
    const equipment = await this.equipmentRepository.findOne({
      where: { id },
      relations: ["project", "project.collaborators"],
    });
    if (!equipment) {
      throw new NotFoundException("Equipment not found");
    }
    const project = equipment.project;
    if (!this.isConsultant(user) && !this.hasProjectAccess(project, user.id)) {
      throw new ForbiddenException("You do not have access to this equipment");
    }
    return equipment;
  }

  async update(id: string, dto: UpdateEquipmentDto, user: User): Promise<Equipment> {
    const equipment = await this.findOne(id, user);
    if (dto.name !== undefined) equipment.name = dto.name;
    if (dto.description !== undefined) equipment.description = dto.description;
    if (dto.quantity !== undefined) equipment.quantity = dto.quantity;
    if (dto.category !== undefined) equipment.category = dto.category;
    if (dto.status !== undefined) equipment.status = dto.status;
    if (dto.serial_number !== undefined) equipment.serial_number = dto.serial_number;
    return this.equipmentRepository.save(equipment);
  }

  async remove(id: string, user: User): Promise<void> {
    const equipment = await this.findOne(id, user);
    await this.equipmentRepository.remove(equipment);
  }
}
