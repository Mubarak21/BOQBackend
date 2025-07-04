export declare class CreateUserDto {
    display_name: string;
    email: string;
    password: string;
    bio?: string;
    avatar_url?: string;
    notification_preferences?: {
        email: boolean;
        project_updates: boolean;
        task_updates: boolean;
    };
    department?: string;
    departmentId?: string;
}
