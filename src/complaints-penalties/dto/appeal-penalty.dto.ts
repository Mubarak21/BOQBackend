import { IsString } from "class-validator";

export class AppealPenaltyDto {
  @IsString()
  reason: string;
}

