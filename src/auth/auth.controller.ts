import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  UseGuards,
  Headers,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { LoginDto } from "./dto/login.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { RateLimitGuard } from "./guards/rate-limit.guard";
import { Public } from "./decorators/public.decorator";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @UseGuards(RateLimitGuard)
  @Post("register")
  async register(@Body() createUserDto: CreateUserDto) {
    try {
      return await this.authService.register(createUserDto);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          error: "Bad Request",
          message: error.message,
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Public()
  @UseGuards(RateLimitGuard)
  @Post("login")
  async login(@Body() loginDto: LoginDto) {
    try {
      return await this.authService.login(loginDto.email, loginDto.password);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          error: "Bad Request",
          message: error.message,
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Public()
  @Post("refresh")
  async refreshToken(@Body("refresh_token") refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException("Refresh token is required");
    }
    return this.authService.refreshToken(refreshToken);
  }

  @Public()
  @Post("logout")
  async logout(@Headers("authorization") authHeader: string) {
    if (!authHeader) {
      throw new UnauthorizedException("Authorization header is required");
    }

    const [type, token] = authHeader.split(" ");
    if (type !== "Bearer" || !token) {
      throw new UnauthorizedException("Invalid authorization header format");
    }

    await this.authService.logout(token);
    return { message: "Logged out successfully" };
  }
}
