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
exports.Activity = exports.ActivityType = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const project_entity_1 = require("./project.entity");
const task_entity_1 = require("./task.entity");
var ActivityType;
(function (ActivityType) {
    ActivityType["PROJECT_CREATED"] = "project_created";
    ActivityType["PROJECT_UPDATED"] = "project_updated";
    ActivityType["PROJECT_DELETED"] = "project_deleted";
    ActivityType["TASK_CREATED"] = "task_created";
    ActivityType["TASK_UPDATED"] = "task_updated";
    ActivityType["TASK_DELETED"] = "task_deleted";
    ActivityType["TASK_COMPLETED"] = "task_completed";
    ActivityType["TASK_REOPENED"] = "task_reopened";
    ActivityType["PHASE_COMPLETED"] = "phase_completed";
    ActivityType["PHASE_REOPENED"] = "phase_reopened";
    ActivityType["SCHEDULE_DELAY"] = "schedule_delay";
    ActivityType["BOQ_UPLOADED"] = "boq_uploaded";
    ActivityType["COMMENT_ADDED"] = "comment_added";
    ActivityType["COLLABORATOR_ADDED"] = "collaborator_added";
    ActivityType["COLLABORATOR_REMOVED"] = "collaborator_removed";
})(ActivityType || (exports.ActivityType = ActivityType = {}));
let Activity = class Activity {
};
exports.Activity = Activity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Activity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: ActivityType,
    }),
    __metadata("design:type", String)
], Activity.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Activity.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Activity.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Activity.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: "user_id" }),
    __metadata("design:type", user_entity_1.User)
], Activity.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Activity.prototype, "project_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => project_entity_1.Project),
    (0, typeorm_1.JoinColumn)({ name: "project_id" }),
    __metadata("design:type", project_entity_1.Project)
], Activity.prototype, "project", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Activity.prototype, "task_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => task_entity_1.Task, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: "task_id" }),
    __metadata("design:type", task_entity_1.Task)
], Activity.prototype, "task", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Activity.prototype, "created_at", void 0);
exports.Activity = Activity = __decorate([
    (0, typeorm_1.Entity)()
], Activity);
//# sourceMappingURL=activity.entity.js.map