export declare class UpdateUserDto {
    display_name?: string;
    bio?: string;
    avatar_url?: string;
    password?: string;
    notification_preferences?: {
        email: boolean;
        project_updates: boolean;
        task_updates: boolean;
    };
}
