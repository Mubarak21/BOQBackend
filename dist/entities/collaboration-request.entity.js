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
exports.CollaborationRequest = exports.CollaborationRequestStatus = void 0;
const typeorm_1 = require("typeorm");
const project_entity_1 = require("./project.entity");
const user_entity_1 = require("./user.entity");
var CollaborationRequestStatus;
(function (CollaborationRequestStatus) {
    CollaborationRequestStatus["PENDING"] = "pending";
    CollaborationRequestStatus["ACCEPTED"] = "accepted";
    CollaborationRequestStatus["REJECTED"] = "rejected";
})(CollaborationRequestStatus || (exports.CollaborationRequestStatus = CollaborationRequestStatus = {}));
let CollaborationRequest = class CollaborationRequest {
};
exports.CollaborationRequest = CollaborationRequest;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], CollaborationRequest.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], CollaborationRequest.prototype, "projectId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => project_entity_1.Project),
    (0, typeorm_1.JoinColumn)({ name: "projectId" }),
    __metadata("design:type", project_entity_1.Project)
], CollaborationRequest.prototype, "project", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], CollaborationRequest.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: "userId" }),
    __metadata("design:type", user_entity_1.User)
], CollaborationRequest.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], CollaborationRequest.prototype, "inviteEmail", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], CollaborationRequest.prototype, "inviterId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: "inviterId" }),
    __metadata("design:type", user_entity_1.User)
], CollaborationRequest.prototype, "inviter", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: CollaborationRequestStatus,
        default: CollaborationRequestStatus.PENDING,
    }),
    __metadata("design:type", String)
], CollaborationRequest.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], CollaborationRequest.prototype, "tokenHash", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamp", nullable: true }),
    __metadata("design:type", Date)
], CollaborationRequest.prototype, "expiresAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], CollaborationRequest.prototype, "createdAt", void 0);
exports.CollaborationRequest = CollaborationRequest = __decorate([
    (0, typeorm_1.Entity)()
], CollaborationRequest);
//# sourceMappingURL=collaboration-request.entity.js.map