import { Repository } from "typeorm";
import { Comment } from "../entities/comment.entity";
import { User } from "../entities/user.entity";
import { CreateCommentDto } from "./dto/create-comment.dto";
import { UpdateCommentDto } from "./dto/update-comment.dto";
export declare class CommentsService {
    private commentsRepository;
    constructor(commentsRepository: Repository<Comment>);
    listByProject(projectId: string): Promise<Comment[]>;
    listByTask(taskId: string): Promise<Comment[]>;
    create(createCommentDto: CreateCommentDto, author: User): Promise<Comment>;
    update(id: string, updateCommentDto: UpdateCommentDto, userId: string): Promise<Comment>;
    remove(id: string, userId: string): Promise<void>;
}
