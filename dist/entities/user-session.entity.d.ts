import { User } from "./user.entity";
export declare class UserSession {
    id: string;
    userId: string;
    user: User;
    token: string;
    ip_address: string;
    user_agent: string;
    device_type: string;
    browser: string;
    os: string;
    expires_at: Date;
    is_active: boolean;
    last_activity: Date;
    location: string;
    createdAt: Date;
}
