import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PhaseEvidence, EvidenceType } from "../entities/phase-evidence.entity";
import { Phase } from "../entities/phase.entity";
import { SubPhase } from "../entities/sub-phase.entity";
import { User } from "../entities/user.entity";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class EvidenceService {
  constructor(
    @InjectRepository(PhaseEvidence)
    private evidenceRepository: Repository<PhaseEvidence>,
    @InjectRepository(Phase)
    private phaseRepository: Repository<Phase>,
    @InjectRepository(SubPhase)
    private subPhaseRepository: Repository<SubPhase>
  ) {}

  async uploadEvidence(
    phaseId: string,
    file: Express.Multer.File | undefined,
    type: EvidenceType,
    notes: string | undefined,
    subPhaseId: string | undefined,
    user: User
  ): Promise<PhaseEvidence> {
    // Verify phase exists
    const phase = await this.phaseRepository.findOne({
      where: { id: phaseId },
    });
    if (!phase) {
      throw new NotFoundException("Phase not found");
    }

    // Verify sub-phase exists if provided
    if (subPhaseId) {
      const subPhase = await this.subPhaseRepository.findOne({
        where: { id: subPhaseId },
      });
      if (!subPhase) {
        throw new NotFoundException("Sub-phase not found");
      }
    }

    // Handle file upload
    let fileUrl: string | null = null;
    if (file) {
      const uploadDir = path.join(process.cwd(), "uploads", "evidence");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const fileName = `${Date.now()}-${file.originalname}`;
      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, file.buffer);
      fileUrl = `/uploads/evidence/${fileName}`;
    }

    const evidence = this.evidenceRepository.create({
      phase_id: phaseId,
      sub_phase_id: subPhaseId || null,
      type,
      file_url: fileUrl,
      notes: notes || null,
      uploaded_by: user.id,
    });

    return this.evidenceRepository.save(evidence);
  }

  async findByPhase(phaseId: string): Promise<PhaseEvidence[]> {
    return this.evidenceRepository.find({
      where: { phase_id: phaseId },
      relations: ["uploader", "subPhase"],
      order: { created_at: "DESC" },
    });
  }

  async findBySubPhase(subPhaseId: string): Promise<PhaseEvidence[]> {
    return this.evidenceRepository.find({
      where: { sub_phase_id: subPhaseId },
      relations: ["uploader", "phase"],
      order: { created_at: "DESC" },
    });
  }
}

