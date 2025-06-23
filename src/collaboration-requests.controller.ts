import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Request,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  CollaborationRequest,
  CollaborationRequestStatus,
} from "./entities/collaboration-request.entity";
import { ProjectsService } from "./projects/projects.service";
import { JwtAuthGuard } from "./auth/guards/jwt-auth.guard";

@Controller("collaboration-requests")
@UseGuards(JwtAuthGuard)
export class CollaborationRequestsController {
  constructor(
    @InjectRepository(CollaborationRequest)
    private readonly collaborationRequestRepository: Repository<CollaborationRequest>,
    private readonly projectsService: ProjectsService
  ) {}

  @Get()
  async getMyRequests(@Request() req) {
    return this.collaborationRequestRepository.find({
      where: {
        userId: req.user.id,
        status: CollaborationRequestStatus.PENDING,
      },
      relations: ["project", "inviter"],
      order: { createdAt: "DESC" },
    });
  }

  @Post(":id/accept")
  async acceptRequest(@Param("id") id: string, @Request() req) {
    const request = await this.collaborationRequestRepository.findOne({
      where: { id },
      relations: ["project"],
    });
    if (!request) throw new NotFoundException("Request not found");
    if (request.userId !== req.user.id) throw new ForbiddenException();
    if (request.status !== CollaborationRequestStatus.PENDING)
      throw new ForbiddenException("Request is not pending");
    // Add user to collaborators
    await this.projectsService.addCollaborator(
      request.projectId,
      req.user,
      request.inviterId
    );
    request.status = CollaborationRequestStatus.ACCEPTED;
    await this.collaborationRequestRepository.save(request);
    return { message: "Collaboration request accepted" };
  }

  @Post(":id/reject")
  async rejectRequest(@Param("id") id: string, @Request() req) {
    const request = await this.collaborationRequestRepository.findOne({
      where: { id },
    });
    if (!request) throw new NotFoundException("Request not found");
    if (request.userId !== req.user.id) throw new ForbiddenException();
    if (request.status !== CollaborationRequestStatus.PENDING)
      throw new ForbiddenException("Request is not pending");
    request.status = CollaborationRequestStatus.REJECTED;
    await this.collaborationRequestRepository.save(request);
    return { message: "Collaboration request rejected" };
  }
}
