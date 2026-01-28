import { Inventory } from "./inventory.entity";
export declare class Supplier {
    id: string;
    name: string;
    contact_person: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    tax_id: string;
    website: string;
    notes: string;
    payment_terms: Record<string, any>;
    is_active: boolean;
    rating: number;
    inventory_items: Inventory[];
    createdAt: Date;
    updatedAt: Date;
}
