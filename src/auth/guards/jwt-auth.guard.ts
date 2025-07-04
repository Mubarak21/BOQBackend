import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthService } from "../auth.service";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private reflector: Reflector,
    private authService: AuthService
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if the route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      this.logger.warn("No authorization header provided");
      throw new UnauthorizedException("No authorization header provided");
    }

    try {
      const token = authHeader.split(" ")[1];
      if (!token) {
        this.logger.warn("No token provided in authorization header");
        throw new UnauthorizedException("No token provided");
      }

      const user = await this.authService.validateToken(token);
      if (!user) {
        this.logger.warn("Invalid token or user not found");
        throw new UnauthorizedException("Invalid token or user not found");
      }

      request.user = user;
      request.isConsultant = user.role === "consultant";
      return true;
    } catch (error) {
      this.logger.error("Token validation failed", error);
      throw new UnauthorizedException("Invalid token");
    }
  }
}
