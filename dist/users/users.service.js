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
    async adminList({ search = "", role, status, page = 1, limit = 10 }) {
        const pageNum = Number(page) || 1;
        const limitNum = Number(limit) || 10;
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
            .skip((pageNum - 1) * limitNum)
            .take(limitNum);
        const [items, total] = await qb.getManyAndCount();
        return {
            users: items.map((u) => ({
                id: u.id,
                display_name: u.display_name,
                email: u.email,
                role: u.role,
                status: u.status,
                bio: u.bio,
                avatar_url: u.avatar_url,
                created_at: u.created_at,
                updated_at: u.updated_at,
                last_login: u.last_login,
            })),
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
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
        if (!body.email || !body.password || !body.display_name) {
            throw new Error("Email, password, and display_name are required");
        }
        const existingUser = await this.usersRepository.findOne({
            where: { email: body.email },
        });
        if (existingUser) {
            throw new Error("User with this email already exists");
        }
        const hashedPassword = await bcrypt.hash(body.password, 10);
        const user = this.usersRepository.create({
            ...body,
            password: hashedPassword,
            status: body.status || "active",
            role: body.role || "user",
            notification_preferences: body.notification_preferences || {
                email: true,
                project_updates: true,
                task_updates: true,
            },
        });
        const savedResult = await this.usersRepository.save(user);
        const savedUser = Array.isArray(savedResult) ? savedResult[0] : savedResult;
        const { password, ...result } = savedUser;
        return result;
    }
    async adminUpdate(id, body) {
        if (body.password) {
            body.password = await bcrypt.hash(body.password, 10);
        }
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
        const results = await this.usersRepository
            .createQueryBuilder("user")
            .select("user.role", "role")
            .addSelect("COUNT(*)", "count")
            .groupBy("user.role")
            .getRawMany();
        const total = results.reduce((sum, result) => sum + parseInt(result.count), 0);
        return results.map((result) => ({
            role: result.role,
            count: parseInt(result.count),
            percentage: total > 0 ? (parseInt(result.count) / total) * 100 : 0,
        }));
    }
    async getUserGrowth(compare = "month") {
        const now = new Date();
        let currentPeriodStart;
        let previousPeriodStart;
        switch (compare) {
            case "week":
                currentPeriodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                previousPeriodStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
                break;
            case "month":
                currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);
                previousPeriodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                break;
            case "quarter":
                const currentQuarter = Math.floor(now.getMonth() / 3);
                currentPeriodStart = new Date(now.getFullYear(), currentQuarter * 3, 1);
                previousPeriodStart = new Date(now.getFullYear(), (currentQuarter - 1) * 3, 1);
                break;
            case "year":
                currentPeriodStart = new Date(now.getFullYear(), 0, 1);
                previousPeriodStart = new Date(now.getFullYear() - 1, 0, 1);
                break;
            default:
                currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);
                previousPeriodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        }
        const [currentCount, previousCount] = await Promise.all([
            this.usersRepository.count({
                where: {
                    created_at: (0, typeorm_2.Between)(currentPeriodStart, now),
                },
            }),
            this.usersRepository.count({
                where: {
                    created_at: (0, typeorm_2.Between)(previousPeriodStart, currentPeriodStart),
                },
            }),
        ]);
        const growth = previousCount > 0
            ? ((currentCount - previousCount) / previousCount) * 100
            : 0;
        return {
            current: currentCount,
            previous: previousCount,
            growth: Math.round(growth * 100) / 100,
        };
    }
    async getUserEngagementMetrics(period = "daily", from, to) {
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
        const activeUsersQuery = this.usersRepository
            .createQueryBuilder("user")
            .select(`to_char(user.last_login, '${groupFormat}')`, "date")
            .addSelect("COUNT(DISTINCT user.id)", "activeUsers")
            .where("user.last_login IS NOT NULL");
        if (startDate) {
            activeUsersQuery.andWhere("user.last_login >= :startDate", { startDate });
        }
        if (endDate) {
            activeUsersQuery.andWhere("user.last_login <= :endDate", { endDate });
        }
        activeUsersQuery.groupBy("date").orderBy("date", "ASC");
        const activeUsersResults = await activeUsersQuery.getRawMany();
        const loginQuery = this.usersRepository
            .createQueryBuilder("user")
            .select(`to_char(user.last_login, '${groupFormat}')`, "date")
            .addSelect("COUNT(*)", "logins")
            .where("user.last_login IS NOT NULL");
        if (startDate) {
            loginQuery.andWhere("user.last_login >= :startDate", { startDate });
        }
        if (endDate) {
            loginQuery.andWhere("user.last_login <= :endDate", { endDate });
        }
        loginQuery.groupBy("date").orderBy("date", "ASC");
        const loginResults = await loginQuery.getRawMany();
        const dateMap = new Map();
        activeUsersResults.forEach((result) => {
            dateMap.set(result.date, {
                date: result.date,
                activeUsers: parseInt(result.activeUsers || "0"),
                logins: 0,
                actions: 0,
            });
        });
        loginResults.forEach((result) => {
            if (dateMap.has(result.date)) {
                dateMap.get(result.date).logins = parseInt(result.logins || "0");
            }
            else {
                dateMap.set(result.date, {
                    date: result.date,
                    activeUsers: 0,
                    logins: parseInt(result.logins || "0"),
                    actions: 0,
                });
            }
        });
        return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map