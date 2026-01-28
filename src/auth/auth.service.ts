import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { JwtService } from "@nestjs/jwt";
import { User } from "../entities/user.entity";
import { CreateUserDto } from "./dto/create-user.dto";
import * as bcrypt from "bcrypt";
import { ConfigService } from "@nestjs/config";
import { Department } from "../entities/department.entity";
import { Admin } from "../entities/admin.entity";
import { CollaborationRequest, CollaborationRequestStatus } from "../entities/collaboration-request.entity";

@Injectable()
export class AuthService {
  private readonly tokenBlacklist: Set<string> = new Set();

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectRepository(Department)
    private departmentRepository: Repository<Department>,
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
    @InjectRepository(CollaborationRequest)
    private collaborationRequestRepository: Repository<CollaborationRequest>
  ) {}

  async register(createUserDto: CreateUserDto): Promise<{
    access_token: string;
    refresh_token: string;
    user: Omit<User, "password">;
  }> {
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new UnauthorizedException("Email already exists");
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    let departmentId = undefined;
    if (createUserDto.departmentId) {
      departmentId = createUserDto.departmentId;
    } else if (createUserDto.department) {
      let department = await this.departmentRepository.findOne({
        where: { name: createUserDto.department },
      });
      if (!department) {
        try {
          department = this.departmentRepository.create({
            name: createUserDto.department,
          });
          department = await this.departmentRepository.save(department);
        } catch (err) {
          // If another request created the department in the meantime, fetch it
          department = await this.departmentRepository.findOne({
            where: { name: createUserDto.department },
          });
          if (!department) throw err;
        }
      }
      departmentId = department.id;
    }
    const user = this.userRepository.create({
      display_name: createUserDto.display_name,
      email: createUserDto.email,
      password: hashedPassword,
      bio: createUserDto.bio,
      avatar_url: createUserDto.avatar_url,
      department_id: departmentId,
    });

    await this.userRepository.save(user);

    // Link any pending invites by email
    const emailLower = createUserDto.email.toLowerCase().trim();
    const pendingInvites = await this.collaborationRequestRepository.find({
      where: {
        inviteEmail: emailLower,
        status: CollaborationRequestStatus.PENDING,
        userId: null, // Only link invites that don't have a userId yet
      },
    });

    // Update pending invites to link them to the new user
    for (const invite of pendingInvites) {
      // Check if invite hasn't expired
      if (!invite.expiresAt || new Date() < invite.expiresAt) {
        invite.userId = user.id;
        invite.inviteEmail = null; // Clear email since we now have userId
        await this.collaborationRequestRepository.save(invite);
      }
    }

    const { password, ...result } = user;

    const [access_token, refresh_token] = await Promise.all([
      this.generateAccessToken(user),
      this.generateRefreshToken(user),
    ]);

    return {
      access_token,
      refresh_token,
      user: result,
    };
  }

  async validateToken(token: string): Promise<User | Admin> {
    try {
      // Check if token is blacklisted
      if (this.tokenBlacklist.has(token)) {
        throw new UnauthorizedException("Token has been invalidated");
      }

      const payload = this.jwtService.verify(token);
      // JWT payload verified - removed console.log to reduce noise

      // Check if token is expired
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        throw new UnauthorizedException("Token has expired");
      }

      // Try to find a user
      let user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });
      if (user) return user;

      // Try to find an admin
      const admin = await this.adminRepository.findOne({
        where: { id: payload.sub },
      });
      if (admin) {
        // Add role from JWT payload to admin object for RolesGuard compatibility
        (admin as any).role = payload.role;
        return admin;
      }

      throw new UnauthorizedException("User or admin not found");
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException("Invalid token");
    }
  }

  async login(
    email: string,
    password: string
  ): Promise<{
    access_token: string;
    refresh_token: string;
    user: Omit<User, "password">;
  }> {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const { password: _, ...result } = user;

    const [access_token, refresh_token] = await Promise.all([
      this.generateAccessToken(user),
      this.generateRefreshToken(user),
    ]);

    return {
      access_token,
      refresh_token,
      user: result,
    };
  }

  private async generateAccessToken(user: User): Promise<string> {
    const payload = {
      sub: user.id,
      email: user.email,
      type: "access",
      role: user.role,
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>("JWT_SECRET"),
      expiresIn: this.configService.get<string>("JWT_EXPIRATION", "15m"),
    });
  }

  private async generateRefreshToken(user: User): Promise<string> {
    const payload = {
      sub: user.id,
      email: user.email,
      type: "refresh",
      role: user.role,
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>("JWT_REFRESH_SECRET"),
      expiresIn: this.configService.get<string>("JWT_REFRESH_EXPIRATION", "7d"),
    });
  }

  async refreshToken(refresh_token: string): Promise<{ access_token: string }> {
    try {
      const payload = this.jwtService.verify(refresh_token, {
        secret: this.configService.get<string>("JWT_REFRESH_SECRET"),
      });

      if (payload.type !== "refresh") {
        throw new UnauthorizedException("Invalid token type");
      }

      // Check if refresh token is expired
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        throw new UnauthorizedException("Refresh token has expired");
      }

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException("User not found");
      }

      const access_token = await this.generateAccessToken(user);
      return { access_token };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException("Invalid refresh token");
    }
  }

  async logout(token: string): Promise<void> {
    try {
      // Verify the token before blacklisting
      const payload = this.jwtService.verify(token);
      this.tokenBlacklist.add(token);

      if (this.tokenBlacklist.size > 1000) {
        this.cleanupBlacklist();
      }
    } catch (error) {
      throw new UnauthorizedException("Invalid token");
    }
  }

  private cleanupBlacklist(): void {
    // Remove tokens that are older than 24 hours
    const now = Date.now();
    for (const token of this.tokenBlacklist) {
      try {
        const payload = this.jwtService.verify(token);
        if (payload.exp * 1000 < now) {
          this.tokenBlacklist.delete(token);
        }
      } catch {
        this.tokenBlacklist.delete(token);
      }
    }
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
