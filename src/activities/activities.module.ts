import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ActivitiesService } from "./activities.service";
import { ActivitiesController } from "./activities.controller";
import { Activity } from "../entities/activity.entity";
import { AuthModule } from "../auth/auth.module";
import { ProjectsModule } from "../projects/projects.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Activity]),
    AuthModule,
    forwardRef(() => ProjectsModule),
  ],
  controllers: [ActivitiesController],
  providers: [ActivitiesService],
  exports: [ActivitiesService],
})
export class ActivitiesModule {}
