import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ComplaintsService } from "./complaints.service";
import { CreateComplaintDto } from "./dto/create-complaint.dto";
import { RespondComplaintDto } from "./dto/respond-complaint.dto";
import { AppealComplaintDto } from "./dto/appeal-complaint.dto";

@Controller("complaints")
@UseGuards(JwtAuthGuard)
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  @Post()
  create(@Body() createComplaintDto: CreateComplaintDto, @Request() req) {
    return this.complaintsService.create(createComplaintDto, req.user);
  }

  @Get("project/:projectId")
  findByProject(@Param("projectId") projectId: string) {
    return this.complaintsService.findByProject(projectId);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.complaintsService.findOne(id);
  }

  @Post(":id/respond")
  respond(
    @Param("id") id: string,
    @Body() respondDto: RespondComplaintDto,
    @Request() req
  ) {
    return this.complaintsService.respond(id, respondDto, req.user);
  }

  @Post(":id/appeal")
  appeal(
    @Param("id") id: string,
    @Body() appealDto: AppealComplaintDto,
    @Request() req
  ) {
    return this.complaintsService.appeal(id, appealDto, req.user);
  }
}

