import { User } from "./user.entity";
export declare class UserPreferences {
    id: string;
    user_id: string;
    user: User;
    notification_preferences: {
        email: boolean;
        project_updates: boolean;
        task_updates: boolean;
        financial_updates: boolean;
        inventory_alerts: boolean;
        system_notifications: boolean;
    };
    language: string;
    timezone: string;
    theme: string;
    items_per_page: number;
    dashboard_layout: Record<string, any>;
    table_preferences: Record<string, any>;
    email_notifications_enabled: boolean;
    push_notifications_enabled: boolean;
    createdAt: Date;
    updatedAt: Date;
}
