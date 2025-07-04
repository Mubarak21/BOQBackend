import { Module, forwardRef } from "@nestjs/common";
import { ConsultantController } from "./consultant.controller";
import { ProjectsModule } from "../projects/projects.module";
import { CommentsModule } from "../comments/comments.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [forwardRef(() => ProjectsModule), CommentsModule, AuthModule],
  controllers: [ConsultantController],
})
export class ConsultantModule {}
