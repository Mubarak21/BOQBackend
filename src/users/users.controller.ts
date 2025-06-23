import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { UpdateUserDto } from "./dto/update-user.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { UserResponseDto } from "./dto/user-response.dto";

@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("profile")
  getProfile(@Request() req) {
    return this.usersService.findOne(req.user.id);
  }

  @Patch("profile")
  updateProfile(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.updateProfile(req.user.id, updateUserDto);
  }

  @Get("search")
  searchUsers(@Query("query") query: string) {
    return this.usersService.searchUsers(query);
  }

  @Get(":id")
  getUserById(@Param("id") id: string) {
    return this.usersService.findOne(id);
  }

  @Get()
  async getAllUsers(): Promise<UserResponseDto[]> {
    return this.usersService.findAllUsers();
  }
}
