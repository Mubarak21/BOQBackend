import { Repository } from "typeorm";
import { User } from "../entities/user.entity";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UserResponseDto } from "./dto/user-response.dto";
export declare class UsersService {
    private usersRepository;
    constructor(usersRepository: Repository<User>);
    findOne(id: string): Promise<User>;
    findByEmail(email: string): Promise<User>;
    updateProfile(id: string, updateUserDto: UpdateUserDto): Promise<User>;
    searchUsers(query: string): Promise<User[]>;
    create(userData: Partial<User>): Promise<User>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<Omit<User, "password">>;
    findAll(): Promise<User[]>;
    findAllUsers(): Promise<UserResponseDto[]>;
    countAll(): Promise<number>;
    getTrends(period?: string, from?: string, to?: string): Promise<any[]>;
    adminList({ search, role, status, page, limit }: {
        search?: string;
        role: any;
        status: any;
        page?: number;
        limit?: number;
    }): Promise<{
        items: {
            id: string;
            name: string;
            email: string;
            role: import("../entities/user.entity").UserRole;
            status: string;
            createdAt: Date;
            lastLogin: Date;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    adminGetDetails(id: string): Promise<{
        id: string;
        name: string;
        email: string;
        role: import("../entities/user.entity").UserRole;
        status: string;
        createdAt: Date;
        lastLogin: Date;
    }>;
    adminCreate(body: any): Promise<User[]>;
    adminUpdate(id: string, body: any): Promise<{
        id: string;
        name: string;
        email: string;
        role: import("../entities/user.entity").UserRole;
        status: string;
        createdAt: Date;
        lastLogin: Date;
    }>;
    adminDelete(id: string): Promise<{
        success: boolean;
    }>;
    getTopActiveUsers(limit?: number): Promise<{
        id: string;
        name: string;
        email: string;
        role: import("../entities/user.entity").UserRole;
        createdAt: Date;
    }[]>;
    getGroupedByRole(): Promise<any[]>;
    getUserGrowth(compare?: string): Promise<{
        current: number;
        previous: number;
        growth: number;
    }>;
}
