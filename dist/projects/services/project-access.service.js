"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectAccessService = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("@nestjs/common");
let ProjectAccessService = class ProjectAccessService {
    checkProjectAccess({ project, userId }) {
        const isOwner = userId ? project.owner_id === userId : false;
        const isCollaborator = userId
            ? (project.collaborators || []).some((c) => c.id === userId)
            : false;
        return { isOwner, isCollaborator };
    }
    hasProjectAccess({ project, userId }) {
        const { isOwner, isCollaborator } = this.checkProjectAccess({
            project,
            userId,
        });
        return isOwner || isCollaborator;
    }
    validateCollaboratorOperation({ project, collaborator, userId, }) {
        if (project.owner_id !== userId) {
            throw new common_2.ForbiddenException("Only the project owner can manage collaborators");
        }
        if (project.collaborators?.some((c) => c.id === collaborator.id)) {
            throw new common_2.BadRequestException("User is already a collaborator");
        }
        if (project.owner_id === collaborator.id) {
            throw new common_2.BadRequestException("Owner cannot be added as collaborator");
        }
    }
};
exports.ProjectAccessService = ProjectAccessService;
exports.ProjectAccessService = ProjectAccessService = __decorate([
    (0, common_1.Injectable)()
], ProjectAccessService);
//# sourceMappingURL=project-access.service.js.map