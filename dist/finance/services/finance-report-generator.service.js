"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var FinanceReportGeneratorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinanceReportGeneratorService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const project_entity_1 = require("../../entities/project.entity");
const budget_category_entity_1 = require("../entities/budget-category.entity");
const project_transaction_entity_1 = require("../entities/project-transaction.entity");
const project_savings_entity_1 = require("../entities/project-savings.entity");
const jspdf_1 = require("jspdf");
const jspdf_autotable_1 = require("jspdf-autotable");
const XLSX = require("xlsx");
const docx_1 = require("docx");
const fs = require("fs");
const path = require("path");
const financial_report_entity_1 = require("../entities/financial-report.entity");
let FinanceReportGeneratorService = FinanceReportGeneratorService_1 = class FinanceReportGeneratorService {
    constructor(projectRepository, budgetCategoryRepository, transactionRepository, savingsRepository) {
        this.projectRepository = projectRepository;
        this.budgetCategoryRepository = budgetCategoryRepository;
        this.transactionRepository = transactionRepository;
        this.savingsRepository = savingsRepository;
        this.logger = new common_1.Logger(FinanceReportGeneratorService_1.name);
    }
    async generateReport(dto, userId) {
        try {
            this.logger.log(`Generating ${dto.format} report for user ${userId}`);
            const ongoingProjects = await this.getOngoingProjects(dto);
            this.logger.log(`Found ${ongoingProjects.length} ongoing projects`);
            if (ongoingProjects.length === 0) {
                throw new Error("No ongoing projects found to generate report");
            }
            const reportData = await this.gatherReportData(ongoingProjects, dto);
            this.logger.log(`Gathered data for ${reportData.projects.length} projects`);
            let result;
            switch (dto.format) {
                case financial_report_entity_1.FileFormat.PDF:
                    result = await this.generatePDF(reportData, dto);
                    break;
                case financial_report_entity_1.FileFormat.EXCEL:
                    result = await this.generateExcel(reportData, dto);
                    break;
                case financial_report_entity_1.FileFormat.WORD:
                    result = await this.generateWord(reportData, dto);
                    break;
                default:
                    throw new Error(`Unsupported format: ${dto.format}`);
            }
            this.logger.log(`Report generated successfully: ${result.fileName}`);
            return result;
        }
        catch (error) {
            this.logger.error(`Error generating report: ${error.message}`, error.stack);
            throw error;
        }
    }
    async getOngoingProjects(dto) {
        const queryBuilder = this.projectRepository
            .createQueryBuilder("project")
            .leftJoinAndSelect("project.owner", "owner")
            .leftJoinAndSelect("project.collaborators", "collaborators")
            .leftJoinAndSelect("project.phases", "phases")
            .where("project.status = :status", { status: project_entity_1.ProjectStatus.IN_PROGRESS });
        if (dto.projectIds && dto.projectIds.length > 0) {
            queryBuilder.andWhere("project.id IN (:...projectIds)", {
                projectIds: dto.projectIds,
            });
        }
        if (dto.dateFrom) {
            queryBuilder.andWhere("project.start_date >= :dateFrom", {
                dateFrom: new Date(dto.dateFrom),
            });
        }
        if (dto.dateTo) {
            queryBuilder.andWhere("project.start_date <= :dateTo", {
                dateTo: new Date(dto.dateTo),
            });
        }
        return await queryBuilder.getMany();
    }
    async gatherReportData(projects, dto) {
        const projectData = await Promise.all(projects.map(async (project) => {
            const categories = await this.budgetCategoryRepository.find({
                where: { projectId: project.id },
            });
            const transactions = dto.includePayments
                ? await this.transactionRepository.find({
                    where: { projectId: project.id },
                    relations: ["category"],
                    order: { transactionDate: "DESC" },
                })
                : [];
            const savings = await this.savingsRepository.find({
                where: { projectId: project.id },
            });
            const totalSpent = categories.reduce((sum, cat) => sum + (parseFloat(String(cat.spentAmount || 0)) || 0), 0);
            const totalBudget = categories.reduce((sum, cat) => sum + (parseFloat(String(cat.budgetedAmount || 0)) || 0), 0);
            const totalSavings = savings.reduce((sum, s) => sum + (parseFloat(String(s.savedAmount || 0)) || 0), 0);
            const projectTotalBudget = parseFloat(String(project.totalBudget || 0)) || totalBudget;
            const projectAllocatedBudget = parseFloat(String(project.allocatedBudget || 0)) || 0;
            const projectSpentAmount = parseFloat(String(project.spentAmount || 0)) || totalSpent;
            const projectInfo = {
                id: project.id,
                title: project.title,
                description: project.description,
                owner: project.owner?.display_name || "Unknown",
                status: project.status,
                totalBudget: projectTotalBudget,
                allocatedBudget: projectAllocatedBudget,
                spentAmount: projectSpentAmount,
                remainingBudget: projectTotalBudget - projectSpentAmount,
                savings: totalSavings,
                startDate: project.start_date,
                endDate: project.end_date,
            };
            if (dto.includeProgress && project.phases) {
                const completedPhases = project.phases.filter((p) => p.status === "completed").length;
                projectInfo.progress = {
                    totalPhases: project.phases.length,
                    completedPhases,
                    completionPercentage: project.phases.length > 0
                        ? Math.round((completedPhases / project.phases.length) * 100)
                        : 0,
                };
            }
            if (dto.includePayments && transactions.length > 0) {
                projectInfo.transactions = transactions.map((t) => ({
                    description: t.description,
                    amount: t.amount,
                    type: t.type,
                    date: t.transactionDate,
                    category: t.category?.name || "Uncategorized",
                }));
            }
            if (dto.includeInventory) {
                projectInfo.inventory = [];
            }
            return projectInfo;
        }));
        const summary = {
            totalProjects: projects.length,
            totalBudget: projectData.reduce((sum, p) => sum + (parseFloat(String(p.totalBudget || 0)) || 0), 0),
            totalSpent: projectData.reduce((sum, p) => sum + (parseFloat(String(p.spentAmount || 0)) || 0), 0),
            totalRemaining: projectData.reduce((sum, p) => sum + (parseFloat(String(p.remainingBudget || 0)) || 0), 0),
            totalSavings: projectData.reduce((sum, p) => sum + (parseFloat(String(p.savings || 0)) || 0), 0),
        };
        return {
            projects: projectData,
            summary,
        };
    }
    async generatePDF(reportData, dto) {
        const doc = new jspdf_1.jsPDF();
        const fileName = `finance-report-${Date.now()}.pdf`;
        const filePath = path.join(process.cwd(), "uploads", "reports", fileName);
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        let yPos = 20;
        doc.setFontSize(20);
        doc.text("Finance Report - Ongoing Projects", 14, yPos);
        yPos += 10;
        doc.setFontSize(12);
        doc.text("Summary", 14, yPos);
        yPos += 8;
        doc.setFontSize(10);
        doc.text(`Total Projects: ${reportData.summary.totalProjects}`, 20, yPos);
        yPos += 6;
        doc.text(`Total Budget: ${this.formatCurrency(reportData.summary.totalBudget)}`, 20, yPos);
        yPos += 6;
        doc.text(`Total Spent: ${this.formatCurrency(reportData.summary.totalSpent)}`, 20, yPos);
        yPos += 6;
        doc.text(`Total Remaining: ${this.formatCurrency(reportData.summary.totalRemaining)}`, 20, yPos);
        yPos += 6;
        doc.text(`Total Savings: ${this.formatCurrency(reportData.summary.totalSavings)}`, 20, yPos);
        yPos += 10;
        if (reportData.projects.length > 0) {
            const tableData = reportData.projects.map((project) => [
                project.title,
                this.formatCurrency(project.totalBudget || 0),
                this.formatCurrency(project.spentAmount || 0),
                this.formatCurrency(project.remainingBudget || 0),
                this.formatCurrency(project.savings || 0),
                project.owner,
                dto.includeProgress && project.progress
                    ? `${project.progress.completionPercentage}%`
                    : "N/A",
            ]);
            (0, jspdf_autotable_1.default)(doc, {
                head: [
                    [
                        "Project",
                        "Budget",
                        "Spent",
                        "Remaining",
                        "Savings",
                        "Owner",
                        dto.includeProgress ? "Progress" : "",
                    ],
                ],
                body: tableData,
                startY: yPos,
                styles: { fontSize: 8 },
                headStyles: { fillColor: [41, 128, 185] },
            });
            yPos = doc.lastAutoTable.finalY + 10;
            if (dto.includePayments || dto.includeProgress) {
                for (const project of reportData.projects) {
                    if (yPos > 250) {
                        doc.addPage();
                        yPos = 20;
                    }
                    doc.setFontSize(12);
                    doc.text(project.title, 14, yPos);
                    yPos += 8;
                    if (dto.includeProgress && project.progress) {
                        doc.setFontSize(10);
                        doc.text(`Progress: ${project.progress.completedPhases}/${project.progress.totalPhases} phases completed (${project.progress.completionPercentage}%)`, 20, yPos);
                        yPos += 6;
                    }
                    if (dto.includePayments && project.transactions) {
                        doc.setFontSize(10);
                        doc.text("Recent Transactions:", 20, yPos);
                        yPos += 6;
                        const transactionData = project.transactions
                            .slice(0, 5)
                            .map((t) => [
                            t.description,
                            this.formatCurrency(t.amount),
                            t.type,
                            t.date ? new Date(t.date).toLocaleDateString() : "N/A",
                        ]);
                        if (transactionData.length > 0) {
                            (0, jspdf_autotable_1.default)(doc, {
                                head: [["Description", "Amount", "Type", "Date"]],
                                body: transactionData,
                                startY: yPos,
                                styles: { fontSize: 7 },
                                headStyles: { fillColor: [52, 152, 219] },
                            });
                            yPos = doc.lastAutoTable.finalY + 10;
                        }
                    }
                }
            }
        }
        const pdfOutput = doc.output("arraybuffer");
        fs.writeFileSync(filePath, Buffer.from(pdfOutput));
        const stats = fs.statSync(filePath);
        return {
            filePath,
            fileName,
            fileSize: stats.size,
        };
    }
    async generateExcel(reportData, dto) {
        const fileName = `finance-report-${Date.now()}.xlsx`;
        const filePath = path.join(process.cwd(), "uploads", "reports", fileName);
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        const wb = XLSX.utils.book_new();
        const summaryData = [
            { Metric: "Total Projects", Value: reportData.summary.totalProjects },
            { Metric: "Total Budget", Value: this.formatCurrency(reportData.summary.totalBudget) },
            { Metric: "Total Spent", Value: this.formatCurrency(reportData.summary.totalSpent) },
            { Metric: "Total Remaining", Value: this.formatCurrency(reportData.summary.totalRemaining) },
            { Metric: "Total Savings", Value: this.formatCurrency(reportData.summary.totalSavings) },
        ];
        const summarySheet = XLSX.utils.json_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");
        const projectsData = reportData.projects.map((project) => ({
            "Project Name": project.title,
            Owner: project.owner,
            "Total Budget": this.formatCurrency(project.totalBudget || 0),
            "Spent Amount": this.formatCurrency(project.spentAmount || 0),
            "Remaining Budget": this.formatCurrency(project.remainingBudget || 0),
            Savings: this.formatCurrency(project.savings || 0),
            "Start Date": project.startDate
                ? new Date(project.startDate).toLocaleDateString()
                : "N/A",
            "End Date": project.endDate
                ? new Date(project.endDate).toLocaleDateString()
                : "N/A",
            Progress: dto.includeProgress && project.progress
                ? `${project.progress.completionPercentage}%`
                : "N/A",
        }));
        const projectsSheet = XLSX.utils.json_to_sheet(projectsData);
        XLSX.utils.book_append_sheet(wb, projectsSheet, "Projects");
        if (dto.includePayments) {
            const allTransactions = [];
            reportData.projects.forEach((project) => {
                if (project.transactions) {
                    project.transactions.forEach((t) => {
                        allTransactions.push({
                            Project: project.title,
                            Description: t.description,
                            Amount: this.formatCurrency(t.amount),
                            Type: t.type,
                            Category: t.category,
                            Date: t.date ? new Date(t.date).toLocaleDateString() : "N/A",
                        });
                    });
                }
            });
            if (allTransactions.length > 0) {
                const transactionsSheet = XLSX.utils.json_to_sheet(allTransactions);
                XLSX.utils.book_append_sheet(wb, transactionsSheet, "Transactions");
            }
        }
        XLSX.writeFile(wb, filePath);
        const stats = fs.statSync(filePath);
        return {
            filePath,
            fileName,
            fileSize: stats.size,
        };
    }
    async generateWord(reportData, dto) {
        const fileName = `finance-report-${Date.now()}.docx`;
        const filePath = path.join(process.cwd(), "uploads", "reports", fileName);
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        const children = [];
        children.push(new docx_1.Paragraph({
            text: "Finance Report - Ongoing Projects",
            heading: docx_1.HeadingLevel.HEADING_1,
            alignment: docx_1.AlignmentType.CENTER,
        }));
        children.push(new docx_1.Paragraph({
            text: "Summary",
            heading: docx_1.HeadingLevel.HEADING_2,
        }));
        children.push(new docx_1.Paragraph({
            children: [
                new docx_1.TextRun({
                    text: `Total Projects: ${reportData.summary.totalProjects}`,
                }),
            ],
        }));
        children.push(new docx_1.Paragraph({
            children: [
                new docx_1.TextRun({
                    text: `Total Budget: ${this.formatCurrency(reportData.summary.totalBudget)}`,
                }),
            ],
        }));
        children.push(new docx_1.Paragraph({
            children: [
                new docx_1.TextRun({
                    text: `Total Spent: ${this.formatCurrency(reportData.summary.totalSpent)}`,
                }),
            ],
        }));
        children.push(new docx_1.Paragraph({
            children: [
                new docx_1.TextRun({
                    text: `Total Remaining: ${this.formatCurrency(reportData.summary.totalRemaining)}`,
                }),
            ],
        }));
        children.push(new docx_1.Paragraph({
            children: [
                new docx_1.TextRun({
                    text: `Total Savings: ${this.formatCurrency(reportData.summary.totalSavings)}`,
                }),
            ],
        }));
        children.push(new docx_1.Paragraph({
            text: "Projects",
            heading: docx_1.HeadingLevel.HEADING_2,
        }));
        if (reportData.projects.length > 0) {
            const tableRows = [];
            const headerCells = [
                new docx_1.TableCell({ children: [new docx_1.Paragraph("Project")] }),
                new docx_1.TableCell({ children: [new docx_1.Paragraph("Budget")] }),
                new docx_1.TableCell({ children: [new docx_1.Paragraph("Spent")] }),
                new docx_1.TableCell({ children: [new docx_1.Paragraph("Remaining")] }),
                new docx_1.TableCell({ children: [new docx_1.Paragraph("Savings")] }),
                new docx_1.TableCell({ children: [new docx_1.Paragraph("Owner")] }),
            ];
            if (dto.includeProgress) {
                headerCells.push(new docx_1.TableCell({ children: [new docx_1.Paragraph("Progress")] }));
            }
            tableRows.push(new docx_1.TableRow({ children: headerCells }));
            reportData.projects.forEach((project) => {
                const cells = [
                    new docx_1.TableCell({ children: [new docx_1.Paragraph(project.title)] }),
                    new docx_1.TableCell({
                        children: [
                            new docx_1.Paragraph(this.formatCurrency(project.totalBudget || 0)),
                        ],
                    }),
                    new docx_1.TableCell({
                        children: [
                            new docx_1.Paragraph(this.formatCurrency(project.spentAmount || 0)),
                        ],
                    }),
                    new docx_1.TableCell({
                        children: [
                            new docx_1.Paragraph(this.formatCurrency(project.remainingBudget || 0)),
                        ],
                    }),
                    new docx_1.TableCell({
                        children: [
                            new docx_1.Paragraph(this.formatCurrency(project.savings || 0)),
                        ],
                    }),
                    new docx_1.TableCell({ children: [new docx_1.Paragraph(project.owner)] }),
                ];
                if (dto.includeProgress && project.progress) {
                    cells.push(new docx_1.TableCell({
                        children: [
                            new docx_1.Paragraph(`${project.progress.completionPercentage}%`),
                        ],
                    }));
                }
                tableRows.push(new docx_1.TableRow({ children: cells }));
            });
            children.push(new docx_1.Table({
                rows: tableRows,
                width: {
                    size: 100,
                    type: docx_1.WidthType.PERCENTAGE,
                },
            }));
            if (dto.includePayments || dto.includeProgress) {
                reportData.projects.forEach((project) => {
                    children.push(new docx_1.Paragraph({
                        text: project.title,
                        heading: docx_1.HeadingLevel.HEADING_3,
                    }));
                    if (dto.includeProgress && project.progress) {
                        children.push(new docx_1.Paragraph({
                            children: [
                                new docx_1.TextRun({
                                    text: `Progress: ${project.progress.completedPhases}/${project.progress.totalPhases} phases completed (${project.progress.completionPercentage}%)`,
                                }),
                            ],
                        }));
                    }
                    if (dto.includePayments && project.transactions) {
                        children.push(new docx_1.Paragraph({
                            text: "Recent Transactions:",
                            heading: docx_1.HeadingLevel.HEADING_4,
                        }));
                        const transactionRows = [
                            new docx_1.TableRow({
                                children: [
                                    new docx_1.TableCell({ children: [new docx_1.Paragraph("Description")] }),
                                    new docx_1.TableCell({ children: [new docx_1.Paragraph("Amount")] }),
                                    new docx_1.TableCell({ children: [new docx_1.Paragraph("Type")] }),
                                    new docx_1.TableCell({ children: [new docx_1.Paragraph("Date")] }),
                                ],
                            }),
                        ];
                        project.transactions.slice(0, 5).forEach((t) => {
                            transactionRows.push(new docx_1.TableRow({
                                children: [
                                    new docx_1.TableCell({ children: [new docx_1.Paragraph(t.description)] }),
                                    new docx_1.TableCell({
                                        children: [new docx_1.Paragraph(this.formatCurrency(t.amount))],
                                    }),
                                    new docx_1.TableCell({ children: [new docx_1.Paragraph(t.type)] }),
                                    new docx_1.TableCell({
                                        children: [
                                            new docx_1.Paragraph(t.date ? new Date(t.date).toLocaleDateString() : "N/A"),
                                        ],
                                    }),
                                ],
                            }));
                        });
                        children.push(new docx_1.Table({
                            rows: transactionRows,
                            width: {
                                size: 100,
                                type: docx_1.WidthType.PERCENTAGE,
                            },
                        }));
                    }
                });
            }
        }
        const doc = new docx_1.Document({
            sections: [
                {
                    children,
                },
            ],
        });
        const buffer = await docx_1.Packer.toBuffer(doc);
        fs.writeFileSync(filePath, buffer);
        const stats = fs.statSync(filePath);
        return {
            filePath,
            fileName,
            fileSize: stats.size,
        };
    }
    formatCurrency(amount) {
        const numAmount = parseFloat(String(amount)) || 0;
        return new Intl.NumberFormat("en-TZ", {
            style: "currency",
            currency: "TZS",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(numAmount);
    }
};
exports.FinanceReportGeneratorService = FinanceReportGeneratorService;
exports.FinanceReportGeneratorService = FinanceReportGeneratorService = FinanceReportGeneratorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __param(1, (0, typeorm_1.InjectRepository)(budget_category_entity_1.BudgetCategory)),
    __param(2, (0, typeorm_1.InjectRepository)(project_transaction_entity_1.ProjectTransaction)),
    __param(3, (0, typeorm_1.InjectRepository)(project_savings_entity_1.ProjectSavings)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], FinanceReportGeneratorService);
//# sourceMappingURL=finance-report-generator.service.js.map