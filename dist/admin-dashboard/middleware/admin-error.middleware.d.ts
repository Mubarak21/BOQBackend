import { NestMiddleware } from "@nestjs/common";
import { Response, NextFunction } from "express";
import { RequestWithUser } from "../../auth/interfaces/request-with-user.interface";
export declare class AdminErrorMiddleware implements NestMiddleware {
    use(req: RequestWithUser, res: Response, next: NextFunction): void;
}
