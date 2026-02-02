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
import { EquipmentService } from "./equipment.service";
import { CreateEquipmentDto } from "./dto/create-equipment.dto";
import { UpdateEquipmentDto } from "./dto/update-equipment.dto";
import { RequestWithUser } from "../auth/interfaces/request-with-user.interface";

@Controller("equipment")
@UseGuards(JwtAuthGuard)
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Get("projects")
  getProjectsWithEquipmentCount(@Request() req: RequestWithUser) {
    return this.equipmentService.getProjectsWithEquipmentCount(req.user);
  }

  @Get("project/:projectId")
  findByProject(
    @Param("projectId") projectId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.equipmentService.findByProject(projectId, req.user);
  }

  @Post("project/:projectId")
  create(
    @Param("projectId") projectId: string,
    @Body() dto: CreateEquipmentDto,
    @Request() req: RequestWithUser,
  ) {
    return this.equipmentService.create(projectId, dto, req.user);
  }

  @Get(":id")
  findOne(@Param("id") id: string, @Request() req: RequestWithUser) {
    return this.equipmentService.findOne(id, req.user);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateEquipmentDto,
    @Request() req: RequestWithUser,
  ) {
    return this.equipmentService.update(id, dto, req.user);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @Request() req: RequestWithUser) {
    return this.equipmentService.remove(id, req.user);
  }
}
