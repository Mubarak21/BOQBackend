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

    // Try to get token from Authorization header first
    let token = null;
    const authHeader = request.headers.authorization;

    if (authHeader) {
      token = authHeader.split(" ")[1];
    } else if (request.cookies && request.cookies.auth_token) {
      // Fallback to cookie if no Authorization header
      token = request.cookies.auth_token;
      this.logger.debug("Using token from cookie");
    }

    if (!token) {
      this.logger.warn("No authorization header or auth_token cookie provided");
      throw new UnauthorizedException(
        "No authorization header or auth_token cookie provided"
      );
    }

    try {
      const user = await this.authService.validateToken(token);
      if (!user) {
        this.logger.warn("Invalid token or user not found");
        throw new UnauthorizedException("Invalid token or user not found");
      }

      request.user = user;
      if (user && "role" in user && user.role === "consultant") {
        request.isConsultant = true;
      } else {
        request.isConsultant = false;
      }
      return true;
    } catch (error) {
      this.logger.error("Token validation failed", error);
      throw new UnauthorizedException("Invalid token");
    }
  }
}
