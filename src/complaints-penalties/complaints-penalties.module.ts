import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Complaint } from "../entities/complaint.entity";
import { Penalty } from "../entities/penalty.entity";
import { Project } from "../entities/project.entity";
import { ComplaintsController } from "./complaints.controller";
import { PenaltiesController } from "./penalties.controller";
import { ComplaintsService } from "./complaints.service";
import { PenaltiesService } from "./penalties.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Complaint, Penalty, Project]),
    AuthModule,
  ],
  controllers: [ComplaintsController, PenaltiesController],
  providers: [ComplaintsService, PenaltiesService],
  exports: [ComplaintsService, PenaltiesService],
})
export class ComplaintsPenaltiesModule {}
