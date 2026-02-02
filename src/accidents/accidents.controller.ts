import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AccidentsService } from "./accidents.service";
import { CreateAccidentDto } from "./dto/create-accident.dto";
import { UpdateAccidentDto } from "./dto/update-accident.dto";
import { RequestWithUser } from "../auth/interfaces/request-with-user.interface";

@Controller("accidents")
@UseGuards(JwtAuthGuard)
export class AccidentsController {
  constructor(private readonly accidentsService: AccidentsService) {}

  @Post("project/:projectId")
  create(
    @Param("projectId") projectId: string,
    @Body() dto: CreateAccidentDto,
    @Request() req: RequestWithUser,
  ) {
    return this.accidentsService.create(projectId, dto, req.user);
  }

  @Get("project/:projectId")
  findByProject(
    @Param("projectId") projectId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.accidentsService.findByProject(projectId, req.user);
  }

  @Get(":id")
  findOne(@Param("id") id: string, @Request() req: RequestWithUser) {
    return this.accidentsService.findOne(id, req.user);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateAccidentDto,
    @Request() req: RequestWithUser,
  ) {
    return this.accidentsService.update(id, dto, req.user);
  }
}
