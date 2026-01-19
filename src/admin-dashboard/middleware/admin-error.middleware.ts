import {
  Injectable,
  NestMiddleware,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Response, NextFunction } from "express";
import { RequestWithUser } from "../../auth/interfaces/request-with-user.interface";

@Injectable()
export class AdminErrorMiddleware implements NestMiddleware {
  use(req: RequestWithUser, res: Response, next: NextFunction) {
    // Add admin-specific error handling
    const originalSend = res.send;

    res.send = function (data) {
      // Log admin actions for audit
      if (req.path.startsWith("/admin/")) {
        console.log(
          `🔐 Admin Action: ${req.method} ${req.path} - User: ${req.user?.email || "unknown"}`
        );
      }

      return originalSend.call(this, data);
    };

    // Handle admin-specific errors
    const originalErrorHandler = res.status;
    res.status = function (code) {
      if (code === 403) {

      }
      return originalErrorHandler.call(this, code);
    };

    next();
  }
}
