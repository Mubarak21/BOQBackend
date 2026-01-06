import { Project } from "../../entities/project.entity";
import { User } from "../../entities/user.entity";
export declare enum VerificationStatus {
    PENDING = "pending",
    VERIFIED = "verified",
    DISPUTED = "disputed"
}
export declare class ProjectSavings {
    id: string;
    projectId: string;
    project: Project;
    category: string;
    budgetedAmount: number;
    actualAmount: number;
    reason: string;
    description: string;
    achievedDate: Date;
    verificationStatus: VerificationStatus;
    verifiedBy: string;
    verifier: User;
    createdAt: Date;
    createdBy: string;
    creator: User;
    get savedAmount(): number;
    get savingsPercentage(): number;
}
