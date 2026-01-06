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
exports.EvidenceService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const phase_evidence_entity_1 = require("../entities/phase-evidence.entity");
const phase_entity_1 = require("../entities/phase.entity");
const sub_phase_entity_1 = require("../entities/sub-phase.entity");
const fs = require("fs");
const path = require("path");
let EvidenceService = class EvidenceService {
    constructor(evidenceRepository, phaseRepository, subPhaseRepository) {
        this.evidenceRepository = evidenceRepository;
        this.phaseRepository = phaseRepository;
        this.subPhaseRepository = subPhaseRepository;
    }
    async uploadEvidence(phaseId, file, type, notes, subPhaseId, user) {
        const phase = await this.phaseRepository.findOne({
            where: { id: phaseId },
        });
        if (!phase) {
            throw new common_1.NotFoundException("Phase not found");
        }
        if (subPhaseId) {
            const subPhase = await this.subPhaseRepository.findOne({
                where: { id: subPhaseId },
            });
            if (!subPhase) {
                throw new common_1.NotFoundException("Sub-phase not found");
            }
        }
        let fileUrl = null;
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
    async findByPhase(phaseId) {
        return this.evidenceRepository.find({
            where: { phase_id: phaseId },
            relations: ["uploader", "subPhase"],
            order: { created_at: "DESC" },
        });
    }
    async findBySubPhase(subPhaseId) {
        return this.evidenceRepository.find({
            where: { sub_phase_id: subPhaseId },
            relations: ["uploader", "phase"],
            order: { created_at: "DESC" },
        });
    }
};
exports.EvidenceService = EvidenceService;
exports.EvidenceService = EvidenceService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(phase_evidence_entity_1.PhaseEvidence)),
    __param(1, (0, typeorm_1.InjectRepository)(phase_entity_1.Phase)),
    __param(2, (0, typeorm_1.InjectRepository)(sub_phase_entity_1.SubPhase)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], EvidenceService);
//# sourceMappingURL=evidence.service.js.map