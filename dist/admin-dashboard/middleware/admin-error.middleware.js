"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminErrorMiddleware = void 0;
const common_1 = require("@nestjs/common");
let AdminErrorMiddleware = class AdminErrorMiddleware {
    use(req, res, next) {
        const originalSend = res.send;
        res.send = function (data) {
            if (req.path.startsWith("/admin/")) {
                console.log(`🔐 Admin Action: ${req.method} ${req.path} - User: ${req.user?.email || "unknown"}`);
            }
            return originalSend.call(this, data);
        };
        const originalErrorHandler = res.status;
        res.status = function (code) {
            if (code === 403) {
                console.log(`🚫 Admin Access Denied: ${req.method} ${req.path}`);
            }
            return originalErrorHandler.call(this, code);
        };
        next();
    }
};
exports.AdminErrorMiddleware = AdminErrorMiddleware;
exports.AdminErrorMiddleware = AdminErrorMiddleware = __decorate([
    (0, common_1.Injectable)()
], AdminErrorMiddleware);
//# sourceMappingURL=admin-error.middleware.js.map