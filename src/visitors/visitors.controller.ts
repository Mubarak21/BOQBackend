import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { VisitorsService } from "./visitors.service";
import { CreateVisitorDto } from "./dto/create-visitor.dto";
import { UpdateVisitorDto } from "./dto/update-visitor.dto";
import { RequestWithUser } from "../auth/interfaces/request-with-user.interface";

@Controller("visitors")
@UseGuards(JwtAuthGuard)
export class VisitorsController {
  constructor(private readonly visitorsService: VisitorsService) {}

  @Post("project/:projectId")
  create(
    @Param("projectId") projectId: string,
    @Body() dto: CreateVisitorDto,
    @Request() req: RequestWithUser,
  ) {
    return this.visitorsService.create(projectId, dto, req.user);
  }

  @Get("project/:projectId")
  findByProject(
    @Param("projectId") projectId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.visitorsService.findByProject(projectId, req.user);
  }

  @Get(":id")
  findOne(@Param("id") id: string, @Request() req: RequestWithUser) {
    return this.visitorsService.findOne(id, req.user);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateVisitorDto,
    @Request() req: RequestWithUser,
  ) {
    return this.visitorsService.update(id, dto, req.user);
  }

  @Delete(":id")
  async remove(@Param("id") id: string, @Request() req: RequestWithUser) {
    await this.visitorsService.remove(id, req.user);
    return { message: "Visitor record removed" };
  }
}
