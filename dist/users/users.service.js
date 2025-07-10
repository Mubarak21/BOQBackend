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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../entities/user.entity");
const bcrypt = require("bcrypt");
let UsersService = class UsersService {
    constructor(usersRepository) {
        this.usersRepository = usersRepository;
    }
    async findOne(id) {
        const user = await this.usersRepository.findOne({
            where: { id },
            select: [
                "id",
                "email",
                "display_name",
                "bio",
                "avatar_url",
                "role",
                "notification_preferences",
                "created_at",
                "updated_at",
            ],
        });
        if (!user) {
            throw new common_1.NotFoundException(`User with ID ${id} not found`);
        }
        return user;
    }
    async findByEmail(email) {
        return this.usersRepository.findOne({ where: { email } });
    }
    async updateProfile(id, updateUserDto) {
        const user = await this.findOne(id);
        Object.assign(user, updateUserDto);
        return this.usersRepository.save(user);
    }
    async searchUsers(query) {
        return this.usersRepository.find({
            where: [
                { display_name: (0, typeorm_2.Like)(`%${query}%`) },
                { email: (0, typeorm_2.Like)(`%${query}%`) },
            ],
            select: [
                "id",
                "email",
                "display_name",
                "bio",
                "avatar_url",
                "role",
                "created_at",
            ],
        });
    }
    async create(userData) {
        const user = this.usersRepository.create(userData);
        return this.usersRepository.save(user);
    }
    async update(id, updateUserDto) {
        const user = await this.findOne(id);
        if (updateUserDto.password) {
            updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
        }
        await this.usersRepository.update(id, updateUserDto);
        return this.findOne(id);
    }
    async findAll() {
        return this.usersRepository.find({
            select: ["id", "email", "display_name", "role"],
            order: {
                display_name: "ASC",
            },
        });
    }
    async findAllUsers() {
        const users = await this.usersRepository.find({
            select: ["id", "display_name", "email"],
            order: { display_name: "ASC" },
        });
        return users.map((u) => ({
            id: u.id,
            display_name: u.display_name,
            email: u.email,
        }));
    }
    async countAll() {
        return this.usersRepository.count();
    }
    async getTrends(period = "weekly", from, to) {
        let startDate = undefined;
        let endDate = undefined;
        if (from)
            startDate = new Date(from);
        if (to)
            endDate = new Date(to);
        let groupFormat;
        switch (period) {
            case "daily":
                groupFormat = "YYYY-MM-DD";
                break;
            case "weekly":
                groupFormat = "IYYY-IW";
                break;
            case "monthly":
            default:
                groupFormat = "YYYY-MM";
                break;
        }
        const qb = this.usersRepository
            .createQueryBuilder("user")
            .select(`to_char(user.created_at, '${groupFormat}')`, "period")
            .addSelect("COUNT(*)", "count");
        if (startDate)
            qb.andWhere("user.created_at >= :startDate", { startDate });
        if (endDate)
            qb.andWhere("user.created_at <= :endDate", { endDate });
        qb.groupBy("period").orderBy("period", "ASC");
        return qb.getRawMany();
    }
    async adminList({ search = "", role, status, page = 1, limit = 20 }) {
        const qb = this.usersRepository.createQueryBuilder("user");
        if (search) {
            qb.andWhere("user.display_name ILIKE :search OR user.email ILIKE :search", { search: `%${search}%` });
        }
        if (role) {
            qb.andWhere("user.role = :role", { role });
        }
        if (status) {
            qb.andWhere("user.status = :status", { status });
        }
        qb.orderBy("user.created_at", "DESC")
            .skip((page - 1) * limit)
            .take(limit);
        const [items, total] = await qb.getManyAndCount();
        return {
            items: items.map((u) => ({
                id: u.id,
                name: u.display_name,
                email: u.email,
                role: u.role,
                status: u.status,
                createdAt: u.created_at,
                lastLogin: u.last_login,
            })),
            total,
            page,
            limit,
        };
    }
    async adminGetDetails(id) {
        const user = await this.usersRepository.findOne({ where: { id } });
        if (!user)
            throw new Error("User not found");
        return {
            id: user.id,
            name: user.display_name,
            email: user.email,
            role: user.role,
            status: user.status,
            createdAt: user.created_at,
            lastLogin: user.last_login,
        };
    }
    async adminCreate(body) {
        const user = this.usersRepository.create(body);
        return this.usersRepository.save(user);
    }
    async adminUpdate(id, body) {
        await this.usersRepository.update(id, body);
        return this.adminGetDetails(id);
    }
    async adminDelete(id) {
        await this.usersRepository.delete(id);
        return { success: true };
    }
    async getTopActiveUsers(limit = 5) {
        const users = await this.usersRepository.find({
            order: { created_at: "DESC" },
            take: limit,
        });
        return users.map((u) => ({
            id: u.id,
            name: u.display_name,
            email: u.email,
            role: u.role,
            createdAt: u.created_at,
        }));
    }
    async getGroupedByRole() {
        const qb = this.usersRepository
            .createQueryBuilder("user")
            .select("user.role", "role")
            .addSelect("COUNT(*)", "count")
            .groupBy("user.role");
        return qb.getRawMany();
    }
    async getUserGrowth(compare = "month") {
        return {
            current: 100,
            previous: 80,
            growth: 25,
        };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map