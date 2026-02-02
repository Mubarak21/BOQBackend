import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Accident } from "../entities/accident.entity";
import { Project } from "../entities/project.entity";
import { AuthModule } from "../auth/auth.module";
import { AccidentsController } from "./accidents.controller";
import { AccidentsService } from "./accidents.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([Accident, Project]),
    AuthModule,
  ],
  controllers: [AccidentsController],
  providers: [AccidentsService],
  exports: [AccidentsService],
})
export class AccidentsModule {}
