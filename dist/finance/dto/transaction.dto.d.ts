import { TransactionType } from "../entities/project-transaction.entity";
export declare class CreateTransactionDto {
    projectId: string;
    categoryId?: string;
    amount: number;
    type: TransactionType;
    description: string;
    vendor?: string;
    transactionDate: string;
    receiptUrl?: string;
}
export declare class TransactionQueryDto {
    projectId?: string;
    category?: string;
    dateFrom?: string;
    dateTo?: string;
    type?: TransactionType;
    page?: number;
    limit?: number;
}
export declare class UpdateTransactionDto {
    projectId?: string;
    categoryId?: string;
    amount?: number;
    type?: TransactionType;
    description?: string;
    vendor?: string;
    transactionDate?: string;
    invoiceNumber?: string;
    receiptUrl?: string;
    notes?: string;
}
export declare class TransactionListResponseDto {
    transactions: any[];
    total: number;
    page: number;
    limit: number;
}
