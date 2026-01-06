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

  async adminList({ search = "", role, status, page = 1, limit = 10 }) {
    // Ensure page and limit are numbers
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

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
      .skip((pageNum - 1) * limitNum)
      .take(limitNum);
    const [items, total] = await qb.getManyAndCount();
    return {
      users: items.map((u) => ({
        id: u.id,
        display_name: u.display_name,
        email: u.email,
        role: u.role,
        status: u.status,
        bio: u.bio,
        avatar_url: u.avatar_url,
        created_at: u.created_at,
        updated_at: u.updated_at,
        last_login: u.last_login,
        // add more fields as needed
      })),
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
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

  async adminCreate(body: any): Promise<Omit<User, "password">> {
    // Validate required fields
    if (!body.email || !body.password || !body.display_name) {
      throw new Error("Email, password, and display_name are required");
    }

    // Check if user already exists
    const existingUser = await this.usersRepository.findOne({
      where: { email: body.email },
    });
    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(body.password, 10);

    // Create user with hashed password and default values
    const user = this.usersRepository.create({
      ...body,
      password: hashedPassword,
      status: body.status || "active",
      role: body.role || "user",
      notification_preferences: body.notification_preferences || {
        email: true,
        project_updates: true,
        task_updates: true,
      },
    });

    const savedResult = await this.usersRepository.save(user);
    const savedUser = Array.isArray(savedResult) ? savedResult[0] : savedResult;

    // Return user without password for security
    const { password, ...result } = savedUser;
    return result;
  }

  async adminUpdate(id: string, body: any) {
    // If password is provided, hash it before updating
    if (body.password) {
      body.password = await bcrypt.hash(body.password, 10);
    }
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
    const results = await this.usersRepository
      .createQueryBuilder("user")
      .select("user.role", "role")
      .addSelect("COUNT(*)", "count")
      .groupBy("user.role")
      .getRawMany();

    const total = results.reduce(
      (sum, result) => sum + parseInt(result.count),
      0
    );

    return results.map((result) => ({
      role: result.role,
      count: parseInt(result.count),
      percentage: total > 0 ? (parseInt(result.count) / total) * 100 : 0,
    }));
  }

  async getUserGrowth(compare: string = "month") {
    const now = new Date();
    let currentPeriodStart: Date;
    let previousPeriodStart: Date;

    switch (compare) {
      case "week":
        currentPeriodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        previousPeriodStart = new Date(
          now.getTime() - 14 * 24 * 60 * 60 * 1000
        );
        break;
      case "month":
        currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        previousPeriodStart = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          1
        );
        break;
      case "quarter":
        const currentQuarter = Math.floor(now.getMonth() / 3);
        currentPeriodStart = new Date(now.getFullYear(), currentQuarter * 3, 1);
        previousPeriodStart = new Date(
          now.getFullYear(),
          (currentQuarter - 1) * 3,
          1
        );
        break;
      case "year":
        currentPeriodStart = new Date(now.getFullYear(), 0, 1);
        previousPeriodStart = new Date(now.getFullYear() - 1, 0, 1);
        break;
      default:
        currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        previousPeriodStart = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          1
        );
    }

    const [currentCount, previousCount] = await Promise.all([
      this.usersRepository.count({
        where: {
          created_at: Between(currentPeriodStart, now),
        },
      }),
      this.usersRepository.count({
        where: {
          created_at: Between(previousPeriodStart, currentPeriodStart),
        },
      }),
    ]);

    const growth =
      previousCount > 0
        ? ((currentCount - previousCount) / previousCount) * 100
        : 0;

    return {
      current: currentCount,
      previous: previousCount,
      growth: Math.round(growth * 100) / 100, // Round to 2 decimal places
    };
  }

  async getUserEngagementMetrics(
    period: string = "daily",
    from?: string,
    to?: string
  ) {
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

    // Get active users (users who have logged in recently)
    const activeUsersQuery = this.usersRepository
      .createQueryBuilder("user")
      .select(`to_char(user.last_login, '${groupFormat}')`, "date")
      .addSelect("COUNT(DISTINCT user.id)", "activeUsers")
      .where("user.last_login IS NOT NULL");

    if (startDate) {
      activeUsersQuery.andWhere("user.last_login >= :startDate", { startDate });
    }
    if (endDate) {
      activeUsersQuery.andWhere("user.last_login <= :endDate", { endDate });
    }

    activeUsersQuery.groupBy("date").orderBy("date", "ASC");
    const activeUsersResults = await activeUsersQuery.getRawMany();

    // Get login counts
    const loginQuery = this.usersRepository
      .createQueryBuilder("user")
      .select(`to_char(user.last_login, '${groupFormat}')`, "date")
      .addSelect("COUNT(*)", "logins")
      .where("user.last_login IS NOT NULL");

    if (startDate) {
      loginQuery.andWhere("user.last_login >= :startDate", { startDate });
    }
    if (endDate) {
      loginQuery.andWhere("user.last_login <= :endDate", { endDate });
    }

    loginQuery.groupBy("date").orderBy("date", "ASC");
    const loginResults = await loginQuery.getRawMany();

    // Combine results
    const dateMap = new Map();

    // Process active users
    activeUsersResults.forEach((result) => {
      dateMap.set(result.date, {
        date: result.date,
        activeUsers: parseInt(result.activeUsers || "0"),
        logins: 0,
        actions: 0,
      });
    });

    // Process logins
    loginResults.forEach((result) => {
      if (dateMap.has(result.date)) {
        dateMap.get(result.date).logins = parseInt(result.logins || "0");
      } else {
        dateMap.set(result.date, {
          date: result.date,
          activeUsers: 0,
          logins: parseInt(result.logins || "0"),
          actions: 0,
        });
      }
    });

    // Convert to array and sort by date
    return Array.from(dateMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );
  }
}
