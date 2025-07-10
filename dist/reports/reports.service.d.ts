import { Repository } from "typeorm";
import { Report } from "../entities/report.entity";
export declare class ReportsService {
    private readonly reportsRepository;
    constructor(reportsRepository: Repository<Report>);
    adminList({ type, status, page, limit }: {
        type: any;
        status: any;
        page?: number;
        limit?: number;
    }): Promise<{
        items: Report[];
        total: number;
        page: number;
        limit: number;
    }>;
    adminGenerate(body: any): Promise<Report>;
    adminGetDetails(id: string): Promise<Report>;
    adminDownload(id: string): Promise<{
        path: string;
        filename: string;
        mimetype: string;
    }>;
    adminDelete(id: string): Promise<{
        success: boolean;
    }>;
}
