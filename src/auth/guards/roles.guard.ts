import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "../decorators/roles.decorator";
import { RequestWithUser } from "../interfaces/request-with-user.interface";

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()]
    );
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    // Debug logging
    this.logger.debug(`Required roles: ${JSON.stringify(requiredRoles)}`);
    this.logger.debug(`User object: ${JSON.stringify(user)}`);
    this.logger.debug(`User role: ${user?.role}`);

    if (!user || !requiredRoles.includes(user.role)) {
      this.logger.warn(
        `Access denied. User role: ${user?.role}, Required: ${requiredRoles}`
      );
      throw new ForbiddenException("You do not have permission (roles)");
    }

    this.logger.debug(`Access granted for role: ${user.role}`);
    return true;
  }
}
