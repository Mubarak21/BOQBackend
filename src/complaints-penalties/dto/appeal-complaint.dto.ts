import { IsString } from "class-validator";

export class AppealComplaintDto {
  @IsString()
  reason: string;
}

