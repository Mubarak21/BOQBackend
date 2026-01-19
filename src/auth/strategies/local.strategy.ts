import { Strategy } from "passport-local";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Admin } from "../../entities/admin.entity";
import * as bcrypt from "bcrypt";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>
  ) {
    super({ usernameField: "email" });
  }

  async validate(email: string, password: string): Promise<any> {
    const admin = await this.adminRepository.findOne({ where: { email } });

    if (!admin) {
      throw new UnauthorizedException("Invalid credentials");
    }
    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }
    // Return admin object (without password)
    const { password: _, ...result } = admin;
    return result;
  }
}
