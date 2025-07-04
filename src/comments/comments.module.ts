import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Comment } from "../entities/comment.entity";
import { CommentsController } from "./comments.controller";
import { UsersModule } from "../users/users.module";
import { ProjectsModule } from "../projects/projects.module";
import { TasksModule } from "../tasks/tasks.module";
import { CommentsService } from "./comments.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Comment]),
    AuthModule,
    UsersModule,
    forwardRef(() => ProjectsModule),
    forwardRef(() => TasksModule),
  ],
  providers: [CommentsService],
  controllers: [CommentsController],
  exports: [CommentsService, TypeOrmModule],
})
export class CommentsModule {}
