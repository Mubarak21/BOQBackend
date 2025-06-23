import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Like } from "typeorm";
import { User } from "../entities/user.entity";
import { UpdateUserDto } from "./dto/update-user.dto";
import * as bcrypt from "bcrypt";
import { UserResponseDto } from "./dto/user-response.dto";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>
  ) {}

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      select: [
        "id",
        "email",
        "display_name",
        "bio",
        "avatar_url",
        "role",
        "notification_preferences",
        "created_at",
        "updated_at",
      ],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async updateProfile(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  async searchUsers(query: string): Promise<User[]> {
    return this.usersRepository.find({
      where: [
        { display_name: Like(`%${query}%`) },
        { email: Like(`%${query}%`) },
      ],
      select: [
        "id",
        "email",
        "display_name",
        "bio",
        "avatar_url",
        "role",
        "created_at",
      ],
    });
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.usersRepository.create(userData);
    return this.usersRepository.save(user);
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto
  ): Promise<Omit<User, "password">> {
    const user = await this.findOne(id);

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    await this.usersRepository.update(id, updateUserDto);
    return this.findOne(id);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      select: ["id", "email", "display_name", "role"],
      order: {
        display_name: "ASC",
      },
    });
  }

  async findAllUsers(): Promise<UserResponseDto[]> {
    const users = await this.usersRepository.find({
      select: ["id", "display_name", "email"],
      order: { display_name: "ASC" },
    });
    return users.map((u) => ({
      id: u.id,
      display_name: u.display_name,
      email: u.email,
    }));
  }
}
