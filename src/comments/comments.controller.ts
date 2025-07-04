import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from "@nestjs/common";
import { CommentsService } from "./comments.service";
import { CreateCommentDto } from "./dto/create-comment.dto";
import { UpdateCommentDto } from "./dto/update-comment.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("comments")
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get("/by-project/:projectId")
  listByProject(@Param("projectId") projectId: string) {
    return this.commentsService.listByProject(projectId);
  }

  @Get("/by-task/:taskId")
  listByTask(@Param("taskId") taskId: string) {
    return this.commentsService.listByTask(taskId);
  }

  @Post()
  create(@Body() createCommentDto: CreateCommentDto, @Request() req) {
    return this.commentsService.create(createCommentDto, req.user);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @Request() req
  ) {
    return this.commentsService.update(id, updateCommentDto, req.user.id);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @Request() req) {
    return this.commentsService.remove(id, req.user.id);
  }

  // qodo: i want for people to be bale to answer each others comments
}
