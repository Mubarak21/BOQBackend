import { UsersService } from "../../../users/users.service";
import { UserRole } from "../../../entities/user.entity";
export declare class AdminUsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    listUsers(search?: string, role?: string, status?: string, page?: number, limit?: number): Promise<{
        items: {
            id: string;
            name: string;
            email: string;
            role: UserRole;
            status: string;
            createdAt: Date;
            lastLogin: Date;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    getUser(id: string): Promise<{
        id: string;
        name: string;
        email: string;
        role: UserRole;
        status: string;
        createdAt: Date;
        lastLogin: Date;
    }>;
    createUser(body: any): Promise<import("../../../entities/user.entity").User[]>;
    updateUser(id: string, body: any): Promise<{
        id: string;
        name: string;
        email: string;
        role: UserRole;
        status: string;
        createdAt: Date;
        lastLogin: Date;
    }>;
    deleteUser(id: string): Promise<{
        success: boolean;
    }>;
}
