import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PenaltiesService } from "./penalties.service";
import { CreatePenaltyDto } from "./dto/create-penalty.dto";
import { AppealPenaltyDto } from "./dto/appeal-penalty.dto";

@Controller("penalties")
@UseGuards(JwtAuthGuard)
export class PenaltiesController {
  constructor(private readonly penaltiesService: PenaltiesService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor("evidence", {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    })
  )
  create(
    @Body() createPenaltyDto: CreatePenaltyDto,
    @Request() req,
    @UploadedFile() evidenceFile?: Express.Multer.File
  ) {
    return this.penaltiesService.create(createPenaltyDto, req.user, evidenceFile);
  }

  @Get("project/:projectId")
  findByProject(@Param("projectId") projectId: string) {
    return this.penaltiesService.findByProject(projectId);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.penaltiesService.findOne(id);
  }

  @Post(":id/appeal")
  appeal(
    @Param("id") id: string,
    @Body() appealDto: AppealPenaltyDto,
    @Request() req
  ) {
    return this.penaltiesService.appeal(id, appealDto, req.user);
  }

  @Post(":id/mark-paid")
  markAsPaid(@Param("id") id: string, @Request() req) {
    return this.penaltiesService.markAsPaid(id, req.user);
  }
}

