import { UsersService } from "./users.service";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UserResponseDto } from "./dto/user-response.dto";
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getProfile(req: any): Promise<import("../entities/user.entity").User>;
    updateProfile(req: any, updateUserDto: UpdateUserDto): Promise<import("../entities/user.entity").User>;
    searchUsers(query: string): Promise<import("../entities/user.entity").User[]>;
    getUserById(id: string): Promise<import("../entities/user.entity").User>;
    getAllUsers(): Promise<UserResponseDto[]>;
}
