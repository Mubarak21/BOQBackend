import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Request,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  Query,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  CollaborationRequest,
  CollaborationRequestStatus,
} from "./entities/collaboration-request.entity";
import { ProjectsService } from "./projects/projects.service";
import { JwtAuthGuard } from "./auth/guards/jwt-auth.guard";
import * as bcrypt from "bcrypt";

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
    // Get requests by userId or by email (for pending email-based invites)
    return this.collaborationRequestRepository.find({
      where: [
        {
          userId: req.user.id,
          status: CollaborationRequestStatus.PENDING,
        },
        {
          inviteEmail: req.user.email.toLowerCase(),
          status: CollaborationRequestStatus.PENDING,
        },
      ],
      relations: ["project", "inviter"],
      order: { createdAt: "DESC" },
    });
  }

  @Post(":id/accept")
  async acceptRequest(
    @Param("id") id: string,
    @Request() req,
    @Query("token") token?: string
  ) {
    const request = await this.collaborationRequestRepository.findOne({
      where: { id },
      relations: ["project"],
    });
    if (!request) throw new NotFoundException("Request not found");
    
    // Check if user is authorized (by userId or by email match)
    const isAuthorized = 
      (request.userId && request.userId === req.user.id) ||
      (request.inviteEmail && request.inviteEmail.toLowerCase() === req.user.email.toLowerCase());
    
    if (!isAuthorized) throw new ForbiddenException();
    if (request.status !== CollaborationRequestStatus.PENDING)
      throw new ForbiddenException("Request is not pending");

    // Check if invite has expired
    if (request.expiresAt && new Date() > request.expiresAt) {
      throw new BadRequestException("This invitation has expired. Please request a new one.");
    }

    // If token is provided, verify it matches
    if (token && request.tokenHash) {
      const isValidToken = await bcrypt.compare(token, request.tokenHash);
      if (!isValidToken) {
        throw new ForbiddenException("Invalid invitation token");
      }
    }

    // If this was an email-based invite, link it to the user now
    if (request.inviteEmail && !request.userId) {
      request.userId = req.user.id;
      request.inviteEmail = null;
    }

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
