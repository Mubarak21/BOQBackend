import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Comment } from "../entities/comment.entity";
import { User } from "../entities/user.entity";
import { Project } from "../entities/project.entity";
import { Task } from "../entities/task.entity";
import { CreateCommentDto } from "./dto/create-comment.dto";
import { UpdateCommentDto } from "./dto/update-comment.dto";

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentsRepository: Repository<Comment>
  ) {}

  async listByProject(projectId: string): Promise<Comment[]> {
    return this.commentsRepository.find({
      where: { project_id: projectId },
      relations: ["author", "project", "task"],
    });
  }

  async listByTask(taskId: string): Promise<Comment[]> {
    return this.commentsRepository.find({
      where: { task_id: taskId },
      relations: ["author", "project", "task"],
    });
  }

  async create(
    createCommentDto: CreateCommentDto,
    author: User
  ): Promise<Comment> {
    const comment = this.commentsRepository.create({
      ...createCommentDto,
      author,
      author_id: author.id,
    });
    return this.commentsRepository.save(comment);
  }

  async update(
    id: string,
    updateCommentDto: UpdateCommentDto,
    userId: string
  ): Promise<Comment> {
    const comment = await this.commentsRepository.findOne({ where: { id } });
    if (!comment)
      throw new NotFoundException(`Comment with ID ${id} not found`);
    if (comment.author_id !== userId)
      throw new ForbiddenException("You can only update your own comments");
    Object.assign(comment, updateCommentDto);
    return this.commentsRepository.save(comment);
  }

  async remove(id: string, userId: string): Promise<void> {
    const comment = await this.commentsRepository.findOne({ where: { id } });
    if (!comment)
      throw new NotFoundException(`Comment with ID ${id} not found`);
    if (comment.author_id !== userId)
      throw new ForbiddenException("You can only delete your own comments");
    await this.commentsRepository.remove(comment);
  }
}
