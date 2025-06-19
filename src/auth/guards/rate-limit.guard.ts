import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly store: Map<string, { count: number; timestamp: number }> =
    new Map();

  constructor(private configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip;
    const now = Date.now();
    const windowMs = this.configService.get<number>(
      "RATE_LIMIT_WINDOW_MS",
      15 * 60 * 1000
    ); // 15 minutes
    const maxRequests = this.configService.get<number>(
      "RATE_LIMIT_MAX_REQUESTS",
      100
    );

    const record = this.store.get(ip);

    if (record) {
      if (now - record.timestamp > windowMs) {
        // Reset if window has passed
        this.store.set(ip, { count: 1, timestamp: now });
      } else if (record.count >= maxRequests) {
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            error: "Too Many Requests",
            message: "Rate limit exceeded. Please try again later.",
            retryAfter: Math.ceil((record.timestamp + windowMs - now) / 1000),
          },
          HttpStatus.TOO_MANY_REQUESTS
        );
      } else {
        record.count++;
        this.store.set(ip, record);
      }
    } else {
      this.store.set(ip, { count: 1, timestamp: now });
    }

    // Clean up old records
    this.cleanup();

    return true;
  }

  private cleanup(): void {
    const now = Date.now();
    const windowMs = this.configService.get<number>(
      "RATE_LIMIT_WINDOW_MS",
      15 * 60 * 1000
    );

    for (const [ip, record] of this.store.entries()) {
      if (now - record.timestamp > windowMs) {
        this.store.delete(ip);
      }
    }
  }
}
