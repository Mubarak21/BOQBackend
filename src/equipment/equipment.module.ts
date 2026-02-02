import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Equipment } from "../entities/equipment.entity";
import { Project } from "../entities/project.entity";
import { AuthModule } from "../auth/auth.module";
import { EquipmentController } from "./equipment.controller";
import { EquipmentService } from "./equipment.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([Equipment, Project]),
    AuthModule,
  ],
  controllers: [EquipmentController],
  providers: [EquipmentService],
  exports: [EquipmentService],
})
export class EquipmentModule {}
