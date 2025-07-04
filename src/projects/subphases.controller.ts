import {
  Controller,
  Patch,
  Param,
  Body,
  HttpCode,
  NotFoundException,
  Req,
  UseGuards,
} from "@nestjs/common";
import { SubPhasesService } from "./subphases.service";
import { SubPhase } from "../entities/sub-phase.entity";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RequestWithUser } from "../auth/interfaces/request-with-user.interface";

@UseGuards(JwtAuthGuard)
@Controller("subphases")
export class SubPhasesController {
  constructor(private readonly subPhasesService: SubPhasesService) {}

  @Patch(":id")
  @HttpCode(200)
  async updateSubPhase(
    @Param("id") id: string,
    @Body("isCompleted") isCompleted: boolean,
    @Req() req: RequestWithUser
  ): Promise<SubPhase> {
    const updated = await this.subPhasesService.update(
      id,
      { isCompleted },
      req.user
    );
    if (!updated) throw new NotFoundException("SubPhase not found");
    return updated;
  }
}
