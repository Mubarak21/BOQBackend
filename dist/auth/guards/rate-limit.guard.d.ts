import { CanActivate, ExecutionContext } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
export declare class RateLimitGuard implements CanActivate {
    private configService;
    private readonly store;
    constructor(configService: ConfigService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private cleanup;
}
