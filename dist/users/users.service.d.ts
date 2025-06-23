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
}
