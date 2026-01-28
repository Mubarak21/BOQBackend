import { ProjectTransaction } from "../finance/entities/project-transaction.entity";
import { User } from "./user.entity";
export declare enum AttachmentType {
    RECEIPT = "receipt",
    INVOICE = "invoice",
    QUOTE = "quote",
    CONTRACT = "contract",
    OTHER = "other"
}
export declare class TransactionAttachment {
    id: string;
    transactionId: string;
    transaction: ProjectTransaction;
    type: AttachmentType;
    file_url: string;
    file_name: string;
    file_mime_type: string;
    file_size: number;
    description: string;
    uploadedBy: string;
    uploader: User;
    createdAt: Date;
}
