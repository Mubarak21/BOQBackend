"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitGuard = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let RateLimitGuard = class RateLimitGuard {
    constructor(configService) {
        this.configService = configService;
        this.store = new Map();
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const ip = request.ip;
        const now = Date.now();
        const windowMs = this.configService.get("RATE_LIMIT_WINDOW_MS", 15 * 60 * 1000);
        const maxRequests = this.configService.get("RATE_LIMIT_MAX_REQUESTS", 100);
        const record = this.store.get(ip);
        if (record) {
            if (now - record.timestamp > windowMs) {
                this.store.set(ip, { count: 1, timestamp: now });
            }
            else if (record.count >= maxRequests) {
                throw new common_1.HttpException({
                    statusCode: common_1.HttpStatus.TOO_MANY_REQUESTS,
                    error: "Too Many Requests",
                    message: "Rate limit exceeded. Please try again later.",
                    retryAfter: Math.ceil((record.timestamp + windowMs - now) / 1000),
                }, common_1.HttpStatus.TOO_MANY_REQUESTS);
            }
            else {
                record.count++;
                this.store.set(ip, record);
            }
        }
        else {
            this.store.set(ip, { count: 1, timestamp: now });
        }
        this.cleanup();
        return true;
    }
    cleanup() {
        const now = Date.now();
        const windowMs = this.configService.get("RATE_LIMIT_WINDOW_MS", 15 * 60 * 1000);
        for (const [ip, record] of this.store.entries()) {
            if (now - record.timestamp > windowMs) {
                this.store.delete(ip);
            }
        }
    }
};
exports.RateLimitGuard = RateLimitGuard;
exports.RateLimitGuard = RateLimitGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RateLimitGuard);
//# sourceMappingURL=rate-limit.guard.js.map