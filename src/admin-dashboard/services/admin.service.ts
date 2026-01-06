import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Admin } from "../../entities/admin.entity";
import { User } from "../../entities/user.entity";
import { Project } from "../../entities/project.entity";
import { Activity } from "../../entities/activity.entity";
import * as bcrypt from "bcrypt";

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>
  ) {}

  async createAdmin(adminData: {
    email: string;
    password: string;
    display_name?: string;
  }): Promise<Admin> {
    // Check if admin with this email already exists
    const existingAdmin = await this.adminRepository.findOne({
      where: { email: adminData.email },
    });

    if (existingAdmin) {
      throw new HttpException(
        "Admin with this email already exists",
        HttpStatus.CONFLICT
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminData.password, 10);

    // Create admin
    const admin = this.adminRepository.create({
      email: adminData.email,
      password: hashedPassword,
      display_name: adminData.display_name || "Admin",
      status: "active",
    });

    return this.adminRepository.save(admin);
  }

  async findAdminByEmail(email: string): Promise<Admin | null> {
    return this.adminRepository.findOne({ where: { email } });
  }

  async findAdminById(id: string): Promise<Admin | null> {
    return this.adminRepository.findOne({ where: { id } });
  }

  async getAllAdmins(): Promise<Admin[]> {
    return this.adminRepository.find({
      select: ["id", "email", "display_name", "status", "created_at"],
    });
  }

  async updateAdmin(id: string, updateData: Partial<Admin>): Promise<Admin> {
    const admin = await this.findAdminById(id);
    if (!admin) {
      throw new HttpException("Admin not found", HttpStatus.NOT_FOUND);
    }

    // Hash password if provided
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    Object.assign(admin, updateData);
    return this.adminRepository.save(admin);
  }

  async deleteAdmin(id: string): Promise<void> {
    const admin = await this.findAdminById(id);
    if (!admin) {
      throw new HttpException("Admin not found", HttpStatus.NOT_FOUND);
    }

    await this.adminRepository.remove(admin);
  }

  async getSystemStats() {
    const [totalUsers, totalProjects, totalActivities, totalAdmins] =
      await Promise.all([
        this.userRepository.count(),
        this.projectRepository.count(),
        this.activityRepository.count(),
        this.adminRepository.count(),
      ]);

    return {
      totalUsers,
      totalProjects,
      totalActivities,
      totalAdmins,
      systemHealth: "operational",
      lastUpdated: new Date().toISOString(),
    };
  }

  async validateAdminPermissions(adminId: string): Promise<boolean> {
    const admin = await this.findAdminById(adminId);
    return admin !== null && admin.status === "active";
  }

  // System Settings Methods
  async getSystemSettings() {
    return {
      general: {
        siteName: "Admin Portal",
        siteDescription: "Project management system",
        timezone: "UTC",
        language: "en",
        dateFormat: "MM/DD/YYYY",
        timeFormat: "12h",
      },
      security: {
        sessionTimeout: 30,
        maxLoginAttempts: 5,
        requireTwoFactor: false,
        passwordMinLength: 8,
        passwordRequireSpecial: false,
        passwordRequireNumbers: false,
        passwordRequireUppercase: false,
      },
      notifications: {
        emailNotifications: true,
        pushNotifications: false,
        smsNotifications: false,
        weeklyDigest: true,
        monthlyReport: true,
        systemAlerts: true,
      },
      appearance: {
        theme: "light",
        primaryColor: "#3B82F6",
        sidebarCollapsed: false,
        showAvatars: true,
        showNotifications: true,
      },
      integrations: {
        enableGoogleAuth: false,
        enableGithubAuth: false,
        enableSlackIntegration: false,
        enableEmailIntegration: true,
      },
    };
  }

  async updateSystemSettings(settings: any) {
    // In a real application, you would save these to a database
    // For now, we'll just return the updated settings
    return {
      success: true,
      message: "Settings updated successfully",
      settings,
    };
  }

  // Profile Management Methods
  async updateAdminProfile(adminId: string, profileData: any) {
    const admin = await this.findAdminById(adminId);
    if (!admin) {
      throw new HttpException("Admin not found", HttpStatus.NOT_FOUND);
    }

    // Update allowed fields
    const allowedFields = [
      "display_name",
      "firstName",
      "lastName",
      "phone",
      "department",
      "title",
      "bio",
      "location",
      "timezone",
      "language",
      "socialLinks",
      "skills",
      "preferences",
      "notifications",
    ];

    for (const field of allowedFields) {
      if (profileData[field] !== undefined) {
        (admin as any)[field] = profileData[field];
      }
    }

    return this.adminRepository.save(admin);
  }

  async changePassword(
    adminId: string,
    currentPassword: string,
    newPassword: string
  ) {
    const admin = await this.findAdminById(adminId);
    if (!admin) {
      throw new HttpException("Admin not found", HttpStatus.NOT_FOUND);
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      admin.password
    );
    if (!isPasswordValid) {
      throw new HttpException(
        "Current password is incorrect",
        HttpStatus.BAD_REQUEST
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    admin.password = hashedPassword;

    await this.adminRepository.save(admin);
    return { success: true, message: "Password changed successfully" };
  }

  async uploadAvatar(adminId: string, file: Express.Multer.File) {
    const admin = await this.findAdminById(adminId);
    if (!admin) {
      throw new HttpException("Admin not found", HttpStatus.NOT_FOUND);
    }

    // In a real application, you would save the file and return the URL
    // For now, we'll simulate this
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${adminId}`;

    // Update admin with avatar URL
    (admin as any).avatarUrl = avatarUrl;
    await this.adminRepository.save(admin);

    return { avatarUrl };
  }
}
