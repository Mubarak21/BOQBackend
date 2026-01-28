import { User } from "./user.entity";
export declare enum AuditAction {
    CREATE = "create",
    UPDATE = "update",
    DELETE = "delete",
    VIEW = "view",
    EXPORT = "export",
    APPROVE = "approve",
    REJECT = "reject",
    LOGIN = "login",
    LOGOUT = "logout",
    PASSWORD_CHANGE = "password_change",
    PERMISSION_CHANGE = "permission_change"
}
export declare enum AuditEntityType {
    USER = "user",
    PROJECT = "project",
    PHASE = "phase",
    TASK = "task",
    TRANSACTION = "transaction",
    INVENTORY = "inventory",
    BUDGET = "budget",
    REPORT = "report",
    COMPLAINT = "complaint"
}
export declare class AuditLog {
    id: string;
    action: AuditAction;
    entity_type: AuditEntityType;
    entity_id: string;
    userId: string;
    user: User;
    description: string;
    old_values: Record<string, any>;
    new_values: Record<string, any>;
    ip_address: string;
    user_agent: string;
    notes: string;
    is_successful: boolean;
    error_message: string;
    createdAt: Date;
}
