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
exports.UserSession = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
let UserSession = class UserSession {
};
exports.UserSession = UserSession;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], UserSession.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: "user_id" }),
    __metadata("design:type", String)
], UserSession.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.sessions, {
        onDelete: "CASCADE",
    }),
    (0, typeorm_1.JoinColumn)({ name: "user_id" }),
    __metadata("design:type", user_entity_1.User)
], UserSession.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], UserSession.prototype, "token", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], UserSession.prototype, "ip_address", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], UserSession.prototype, "user_agent", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], UserSession.prototype, "device_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], UserSession.prototype, "browser", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], UserSession.prototype, "os", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamp" }),
    __metadata("design:type", Date)
], UserSession.prototype, "expires_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: true }),
    __metadata("design:type", Boolean)
], UserSession.prototype, "is_active", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamp", nullable: true }),
    __metadata("design:type", Date)
], UserSession.prototype, "last_activity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], UserSession.prototype, "location", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at" }),
    __metadata("design:type", Date)
], UserSession.prototype, "createdAt", void 0);
exports.UserSession = UserSession = __decorate([
    (0, typeorm_1.Entity)("user_sessions"),
    (0, typeorm_1.Index)(["userId", "is_active"]),
    (0, typeorm_1.Index)(["token"])
], UserSession);
//# sourceMappingURL=user-session.entity.js.map