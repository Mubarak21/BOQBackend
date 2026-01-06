import { UsersService } from "../../../users/users.service";
export declare class AdminUsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    listUsers(search?: string, role?: string, status?: string, page?: number, limit?: number): Promise<{
        users: {
            id: string;
            display_name: string;
            email: string;
            role: import("../../../entities/user.entity").UserRole;
            status: string;
            bio: string;
            avatar_url: string;
            created_at: Date;
            updated_at: Date;
            last_login: Date;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getUser(id: string): Promise<{
        id: string;
        name: string;
        email: string;
        role: import("../../../entities/user.entity").UserRole;
        status: string;
        createdAt: Date;
        lastLogin: Date;
    }>;
    createUser(body: any): Promise<Omit<import("../../../entities/user.entity").User, "password">>;
    updateUser(id: string, body: any): Promise<{
        id: string;
        name: string;
        email: string;
        role: import("../../../entities/user.entity").UserRole;
        status: string;
        createdAt: Date;
        lastLogin: Date;
    }>;
    deleteUser(id: string): Promise<{
        success: boolean;
    }>;
}
