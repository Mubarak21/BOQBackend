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
exports.User = exports.UserRole = void 0;
const typeorm_1 = require("typeorm");
const project_entity_1 = require("./project.entity");
const comment_entity_1 = require("./comment.entity");
const department_entity_1 = require("./department.entity");
const user_preferences_entity_1 = require("./user-preferences.entity");
const user_session_entity_1 = require("./user-session.entity");
var UserRole;
(function (UserRole) {
    UserRole["USER"] = "user";
    UserRole["CONSULTANT"] = "consultant";
    UserRole["CONTRACTOR"] = "contractor";
    UserRole["SUB_CONTRACTOR"] = "sub_contractor";
    UserRole["FINANCE"] = "finance";
})(UserRole || (exports.UserRole = UserRole = {}));
let User = class User {
};
exports.User = User;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], User.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], User.prototype, "password", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], User.prototype, "display_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], User.prototype, "bio", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], User.prototype, "avatar_url", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: UserRole,
        default: UserRole.USER,
    }),
    __metadata("design:type", String)
], User.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => user_preferences_entity_1.UserPreferences, (preferences) => preferences.user, {
        cascade: true,
    }),
    __metadata("design:type", user_preferences_entity_1.UserPreferences)
], User.prototype, "preferences", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => user_session_entity_1.UserSession, (session) => session.user),
    __metadata("design:type", Array)
], User.prototype, "sessions", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "active" }),
    __metadata("design:type", String)
], User.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: "timestamp" }),
    __metadata("design:type", Date)
], User.prototype, "last_login", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], User.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], User.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => project_entity_1.Project, (project) => project.owner),
    __metadata("design:type", Array)
], User.prototype, "owned_projects", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => project_entity_1.Project, (project) => project.collaborators),
    __metadata("design:type", Array)
], User.prototype, "collaborating_projects", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => comment_entity_1.Comment, (comment) => comment.author),
    __metadata("design:type", Array)
], User.prototype, "comments", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], User.prototype, "department_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => department_entity_1.Department, (department) => department.users, {
        nullable: true,
    }),
    (0, typeorm_1.JoinColumn)({ name: "department_id" }),
    __metadata("design:type", department_entity_1.Department)
], User.prototype, "department", void 0);
exports.User = User = __decorate([
    (0, typeorm_1.Entity)("users")
], User);
//# sourceMappingURL=user.entity.js.map