import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import { UsersService } from "../../../users/users.service";
import { JwtAuthGuard } from "../../../auth/guards/jwt-auth.guard";

@Controller("consultant/users")
@UseGuards(JwtAuthGuard)
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  // 1. Paginated, filterable, searchable list
  @Get()
  async listUsers(
    @Query("search") search: string = "",
    @Query("role") role?: string,
    @Query("status") status?: string,
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 10
  ) {
    return this.usersService.adminList({ search, role, status, page, limit });
  }

  // 2. User details
  @Get(":id")
  async getUser(@Param("id") id: string) {
    return this.usersService.adminGetDetails(id);
  }

  // 3. Create user
  @Post()
  async createUser(@Body() body) {
    return this.usersService.adminCreate(body);
  }

  // 4. Update user
  @Put(":id")
  async updateUser(@Param("id") id: string, @Body() body) {
    return this.usersService.adminUpdate(id, body);
  }

  // 5. Delete user
  @Delete(":id")
  async deleteUser(@Param("id") id: string) {
    return this.usersService.adminDelete(id);
  }

  // 6. (Optional) Endpoints for user-related data can be added here
}
