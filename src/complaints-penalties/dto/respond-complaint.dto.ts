import { IsString } from "class-validator";

export class RespondComplaintDto {
  @IsString()
  response: string;
}

