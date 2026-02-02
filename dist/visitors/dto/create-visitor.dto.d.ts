import { VisitorPriority } from "../../entities/visitor.entity";
export declare class CreateVisitorDto {
    visitor_name: string;
    company?: string;
    visit_date: string;
    priority: VisitorPriority;
    purpose?: string;
}
