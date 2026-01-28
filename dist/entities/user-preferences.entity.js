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
exports.UserPreferences = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
let UserPreferences = class UserPreferences {
};
exports.UserPreferences = UserPreferences;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], UserPreferences.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], UserPreferences.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => user_entity_1.User, (user) => user.preferences, {
        onDelete: "CASCADE",
    }),
    (0, typeorm_1.JoinColumn)({ name: "user_id" }),
    __metadata("design:type", user_entity_1.User)
], UserPreferences.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "jsonb", default: {} }),
    __metadata("design:type", Object)
], UserPreferences.prototype, "notification_preferences", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 50, default: "en" }),
    __metadata("design:type", String)
], UserPreferences.prototype, "language", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 50, default: "UTC" }),
    __metadata("design:type", String)
], UserPreferences.prototype, "timezone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 20, default: "dark" }),
    __metadata("design:type", String)
], UserPreferences.prototype, "theme", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", default: 10 }),
    __metadata("design:type", Number)
], UserPreferences.prototype, "items_per_page", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "jsonb", nullable: true }),
    __metadata("design:type", Object)
], UserPreferences.prototype, "dashboard_layout", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "jsonb", nullable: true }),
    __metadata("design:type", Object)
], UserPreferences.prototype, "table_preferences", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: true }),
    __metadata("design:type", Boolean)
], UserPreferences.prototype, "email_notifications_enabled", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: true }),
    __metadata("design:type", Boolean)
], UserPreferences.prototype, "push_notifications_enabled", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: "created_at" }),
    __metadata("design:type", Date)
], UserPreferences.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: "updated_at" }),
    __metadata("design:type", Date)
], UserPreferences.prototype, "updatedAt", void 0);
exports.UserPreferences = UserPreferences = __decorate([
    (0, typeorm_1.Entity)("user_preferences")
], UserPreferences);
//# sourceMappingURL=user-preferences.entity.js.map