import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Visitor } from "../entities/visitor.entity";
import { Project } from "../entities/project.entity";
import { AuthModule } from "../auth/auth.module";
import { VisitorsController } from "./visitors.controller";
import { VisitorsService } from "./visitors.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([Visitor, Project]),
    AuthModule,
  ],
  controllers: [VisitorsController],
  providers: [VisitorsService],
  exports: [VisitorsService],
})
export class VisitorsModule {}
