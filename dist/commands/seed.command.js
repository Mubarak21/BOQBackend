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
exports.SeedCommand = exports.SeedService = void 0;
const nestjs_command_1 = require("nestjs-command");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../entities/user.entity");
const department_entity_1 = require("../entities/department.entity");
const bcrypt = require("bcrypt");
let SeedService = class SeedService {
    constructor(userRepository, departmentRepository) {
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
    }
    async seed() {
        const departments = ["Engineering", "HR", "Finance"];
        for (const name of departments) {
            let dept = await this.departmentRepository.findOne({ where: { name } });
            if (!dept) {
                dept = this.departmentRepository.create({ name });
                await this.departmentRepository.save(dept);
                console.log(`Created department: ${name}`);
            }
        }
        const users = [
            {
                email: "admin@example.com",
                password: "admin123",
                display_name: "Admin User",
                role: user_entity_1.UserRole.ADMIN,
                department: "Engineering",
            },
            {
                email: "user@example.com",
                password: "user123",
                display_name: "Regular User",
                role: user_entity_1.UserRole.USER,
                department: "HR",
            },
        ];
        for (const u of users) {
            let user = await this.userRepository.findOne({
                where: { email: u.email },
            });
            if (!user) {
                const department = await this.departmentRepository.findOne({
                    where: { name: u.department },
                });
                const hashedPassword = await bcrypt.hash(u.password, 10);
                user = this.userRepository.create({
                    email: u.email,
                    password: hashedPassword,
                    display_name: u.display_name,
                    role: u.role,
                    department_id: department?.id,
                    notification_preferences: {
                        email: true,
                        project_updates: true,
                        task_updates: true,
                    },
                });
                await this.userRepository.save(user);
                console.log(`Created user: ${u.email}`);
            }
        }
        console.log("✅ Seeding complete!");
    }
};
exports.SeedService = SeedService;
exports.SeedService = SeedService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(department_entity_1.Department)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], SeedService);
let SeedCommand = class SeedCommand {
    constructor(seedService) {
        this.seedService = seedService;
    }
    async run() {
        await this.seedService.seed();
    }
};
exports.SeedCommand = SeedCommand;
__decorate([
    (0, nestjs_command_1.Command)({ command: "seed", describe: "seed the database with initial data" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SeedCommand.prototype, "run", null);
exports.SeedCommand = SeedCommand = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [SeedService])
], SeedCommand);
//# sourceMappingURL=seed.command.js.map