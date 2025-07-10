import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Like, Between } from "typeorm";
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

  async countAll(): Promise<number> {
    return this.usersRepository.count();
  }

  async getTrends(period: string = "weekly", from?: string, to?: string) {
    let startDate: Date | undefined = undefined;
    let endDate: Date | undefined = undefined;
    if (from) startDate = new Date(from);
    if (to) endDate = new Date(to);
    let groupFormat: string;
    switch (period) {
      case "daily":
        groupFormat = "YYYY-MM-DD";
        break;
      case "weekly":
        groupFormat = "IYYY-IW";
        break;
      case "monthly":
      default:
        groupFormat = "YYYY-MM";
        break;
    }
    const qb = this.usersRepository
      .createQueryBuilder("user")
      .select(`to_char(user.created_at, '${groupFormat}')`, "period")
      .addSelect("COUNT(*)", "count");
    if (startDate) qb.andWhere("user.created_at >= :startDate", { startDate });
    if (endDate) qb.andWhere("user.created_at <= :endDate", { endDate });
    qb.groupBy("period").orderBy("period", "ASC");
    return qb.getRawMany();
  }

  async adminList({ search = "", role, status, page = 1, limit = 20 }) {
    const qb = this.usersRepository.createQueryBuilder("user");
    if (search) {
      qb.andWhere(
        "user.display_name ILIKE :search OR user.email ILIKE :search",
        { search: `%${search}%` }
      );
    }
    if (role) {
      qb.andWhere("user.role = :role", { role });
    }
    if (status) {
      qb.andWhere("user.status = :status", { status });
    }
    qb.orderBy("user.created_at", "DESC")
      .skip((page - 1) * limit)
      .take(limit);
    const [items, total] = await qb.getManyAndCount();
    return {
      items: items.map((u) => ({
        id: u.id,
        name: u.display_name,
        email: u.email,
        role: u.role,
        status: u.status,
        createdAt: u.created_at,
        lastLogin: u.last_login,
        // add more fields as needed
      })),
      total,
      page,
      limit,
    };
  }

  async adminGetDetails(id: string) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new Error("User not found");
    // Optionally fetch related projects/activities
    return {
      id: user.id,
      name: user.display_name,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.created_at,
      lastLogin: user.last_login,
      // add more fields as needed
    };
  }

  async adminCreate(body: any) {
    // You may want to validate and hash password, etc.
    const user = this.usersRepository.create(body);
    return this.usersRepository.save(user);
  }

  async adminUpdate(id: string, body: any) {
    await this.usersRepository.update(id, body);
    return this.adminGetDetails(id);
  }

  async adminDelete(id: string) {
    await this.usersRepository.delete(id);
    return { success: true };
  }

  async getTopActiveUsers(limit: number = 5) {
    // Placeholder: sort by created_at desc, replace with real activity metric if available
    const users = await this.usersRepository.find({
      order: { created_at: "DESC" },
      take: limit,
    });
    return users.map((u) => ({
      id: u.id,
      name: u.display_name,
      email: u.email,
      role: u.role,
      createdAt: u.created_at,
      // add more fields as needed
    }));
  }

  async getGroupedByRole() {
    const qb = this.usersRepository
      .createQueryBuilder("user")
      .select("user.role", "role")
      .addSelect("COUNT(*)", "count")
      .groupBy("user.role");
    return qb.getRawMany();
  }

  async getUserGrowth(compare: string = "month") {
    // Dummy implementation: return static comparison
    return {
      current: 100,
      previous: 80,
      growth: 25, // percent
    };
  }
}
