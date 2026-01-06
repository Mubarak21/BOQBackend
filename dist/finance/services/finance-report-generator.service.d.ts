import { Repository } from "typeorm";
import { Project } from "../../entities/project.entity";
import { BudgetCategory } from "../entities/budget-category.entity";
import { ProjectTransaction } from "../entities/project-transaction.entity";
import { ProjectSavings } from "../entities/project-savings.entity";
import { GenerateReportDto } from "../dto/generate-report.dto";
export declare class FinanceReportGeneratorService {
    private readonly projectRepository;
    private readonly budgetCategoryRepository;
    private readonly transactionRepository;
    private readonly savingsRepository;
    private readonly logger;
    constructor(projectRepository: Repository<Project>, budgetCategoryRepository: Repository<BudgetCategory>, transactionRepository: Repository<ProjectTransaction>, savingsRepository: Repository<ProjectSavings>);
    generateReport(dto: GenerateReportDto, userId: string): Promise<{
        filePath: string;
        fileName: string;
        fileSize: number;
    }>;
    private getOngoingProjects;
    private gatherReportData;
    private generatePDF;
    private generateExcel;
    private generateWord;
    private formatCurrency;
}
