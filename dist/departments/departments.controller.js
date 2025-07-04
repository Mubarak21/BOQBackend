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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DepartmentsController = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const department_entity_1 = require("../entities/department.entity");
const project_entity_1 = require("../entities/project.entity");
const user_entity_1 = require("../entities/user.entity");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const public_decorator_1 = require("../auth/decorators/public.decorator");
let DepartmentsController = class DepartmentsController {
    constructor(departmentRepository, projectRepository, userRepository) {
        this.departmentRepository = departmentRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
    }
    async getAllDepartments() {
        return this.departmentRepository.find();
    }
    async createDepartment(body) {
        let department = await this.departmentRepository.findOne({
            where: { name: body.name },
        });
        if (department)
            return department;
        department = this.departmentRepository.create({ name: body.name });
        return this.departmentRepository.save(department);
    }
    async updateDepartment(id, body) {
        await this.departmentRepository.update(id, { name: body.name });
        return this.departmentRepository.findOne({ where: { id } });
    }
    async deleteDepartment(id) {
        return this.departmentRepository.delete(id);
    }
    async getProjectsForMyDepartment(req) {
        const user = await this.userRepository.findOne({
            where: { id: req.user.id },
        });
        if (!user?.department_id)
            return [];
        return this.projectRepository.find({
            where: { department_id: user.department_id },
        });
    }
};
exports.DepartmentsController = DepartmentsController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DepartmentsController.prototype, "getAllDepartments", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DepartmentsController.prototype, "createDepartment", null);
__decorate([
    (0, common_1.Patch)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DepartmentsController.prototype, "updateDepartment", null);
__decorate([
    (0, common_1.Delete)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DepartmentsController.prototype, "deleteDepartment", null);
__decorate([
    (0, common_1.Get)("my-projects"),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DepartmentsController.prototype, "getProjectsForMyDepartment", null);
exports.DepartmentsController = DepartmentsController = __decorate([
    (0, common_1.Controller)("departments"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, typeorm_1.InjectRepository)(department_entity_1.Department)),
    __param(1, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], DepartmentsController);
//# sourceMappingURL=departments.controller.js.map