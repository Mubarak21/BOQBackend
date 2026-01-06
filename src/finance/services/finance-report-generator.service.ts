import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Project, ProjectStatus } from "../../entities/project.entity";
import { BudgetCategory } from "../entities/budget-category.entity";
import { ProjectTransaction } from "../entities/project-transaction.entity";
import { ProjectSavings } from "../entities/project-savings.entity";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  WidthType,
  TextRun,
  AlignmentType,
  HeadingLevel,
} from "docx";
import * as fs from "fs";
import * as path from "path";
import { FileFormat } from "../entities/financial-report.entity";
import { GenerateReportDto } from "../dto/generate-report.dto";

interface ReportData {
  projects: any[];
  summary: {
    totalProjects: number;
    totalBudget: number;
    totalSpent: number;
    totalRemaining: number;
    totalSavings: number;
  };
}

@Injectable()
export class FinanceReportGeneratorService {
  private readonly logger = new Logger(FinanceReportGeneratorService.name);

  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(BudgetCategory)
    private readonly budgetCategoryRepository: Repository<BudgetCategory>,
    @InjectRepository(ProjectTransaction)
    private readonly transactionRepository: Repository<ProjectTransaction>,
    @InjectRepository(ProjectSavings)
    private readonly savingsRepository: Repository<ProjectSavings>
  ) {}

  async generateReport(
    dto: GenerateReportDto,
    userId: string
  ): Promise<{ filePath: string; fileName: string; fileSize: number }> {
    try {
      this.logger.log(`Generating ${dto.format} report for user ${userId}`);

      // Get ongoing projects
      const ongoingProjects = await this.getOngoingProjects(dto);
      this.logger.log(`Found ${ongoingProjects.length} ongoing projects`);

      if (ongoingProjects.length === 0) {
        throw new Error("No ongoing projects found to generate report");
      }

      // Gather report data
      const reportData = await this.gatherReportData(ongoingProjects, dto);
      this.logger.log(`Gathered data for ${reportData.projects.length} projects`);

      // Generate file based on format
      let result;
      switch (dto.format) {
        case FileFormat.PDF:
          result = await this.generatePDF(reportData, dto);
          break;
        case FileFormat.EXCEL:
          result = await this.generateExcel(reportData, dto);
          break;
        case FileFormat.WORD:
          result = await this.generateWord(reportData, dto);
          break;
        default:
          throw new Error(`Unsupported format: ${dto.format}`);
      }

      this.logger.log(`Report generated successfully: ${result.fileName}`);
      return result;
    } catch (error) {
      this.logger.error(`Error generating report: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async getOngoingProjects(dto: GenerateReportDto): Promise<Project[]> {
    const queryBuilder = this.projectRepository
      .createQueryBuilder("project")
      .leftJoinAndSelect("project.owner", "owner")
      .leftJoinAndSelect("project.collaborators", "collaborators")
      .leftJoinAndSelect("project.phases", "phases")
      .where("project.status = :status", { status: ProjectStatus.IN_PROGRESS });

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

  private async gatherReportData(
    projects: Project[],
    dto: GenerateReportDto
  ): Promise<ReportData> {
    const projectData = await Promise.all(
      projects.map(async (project) => {
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

        const totalSpent = categories.reduce(
          (sum, cat) => sum + (parseFloat(String(cat.spentAmount || 0)) || 0),
          0
        );
        const totalBudget = categories.reduce(
          (sum, cat) => sum + (parseFloat(String(cat.budgetedAmount || 0)) || 0),
          0
        );
        const totalSavings = savings.reduce(
          (sum, s) => sum + (parseFloat(String(s.savedAmount || 0)) || 0),
          0
        );

        const projectTotalBudget = parseFloat(String(project.totalBudget || 0)) || totalBudget;
        const projectAllocatedBudget = parseFloat(String(project.allocatedBudget || 0)) || 0;
        const projectSpentAmount = parseFloat(String(project.spentAmount || 0)) || totalSpent;

        const projectInfo: any = {
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
          const completedPhases = project.phases.filter(
            (p) => p.status === "completed"
          ).length;
          projectInfo.progress = {
            totalPhases: project.phases.length,
            completedPhases,
            completionPercentage:
              project.phases.length > 0
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
          // Note: Inventory would need to be fetched from inventory service
          // For now, we'll leave it empty
          projectInfo.inventory = [];
        }

        return projectInfo;
      })
    );

    const summary = {
      totalProjects: projects.length,
      totalBudget: projectData.reduce(
        (sum, p) => sum + (parseFloat(String(p.totalBudget || 0)) || 0),
        0
      ),
      totalSpent: projectData.reduce(
        (sum, p) => sum + (parseFloat(String(p.spentAmount || 0)) || 0),
        0
      ),
      totalRemaining: projectData.reduce(
        (sum, p) => sum + (parseFloat(String(p.remainingBudget || 0)) || 0),
        0
      ),
      totalSavings: projectData.reduce(
        (sum, p) => sum + (parseFloat(String(p.savings || 0)) || 0),
        0
      ),
    };

    return {
      projects: projectData,
      summary,
    };
  }

  private async generatePDF(
    reportData: ReportData,
    dto: GenerateReportDto
  ): Promise<{ filePath: string; fileName: string; fileSize: number }> {
    const doc = new jsPDF();
    const fileName = `finance-report-${Date.now()}.pdf`;
    const filePath = path.join(process.cwd(), "uploads", "reports", fileName);

    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    let yPos = 20;

    // Title
    doc.setFontSize(20);
    doc.text("Finance Report - Ongoing Projects", 14, yPos);
    yPos += 10;

    // Summary
    doc.setFontSize(12);
    doc.text("Summary", 14, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.text(`Total Projects: ${reportData.summary.totalProjects}`, 20, yPos);
    yPos += 6;
    doc.text(
      `Total Budget: ${this.formatCurrency(reportData.summary.totalBudget)}`,
      20,
      yPos
    );
    yPos += 6;
    doc.text(
      `Total Spent: ${this.formatCurrency(reportData.summary.totalSpent)}`,
      20,
      yPos
    );
    yPos += 6;
    doc.text(
      `Total Remaining: ${this.formatCurrency(reportData.summary.totalRemaining)}`,
      20,
      yPos
    );
    yPos += 6;
    doc.text(
      `Total Savings: ${this.formatCurrency(reportData.summary.totalSavings)}`,
      20,
      yPos
    );
    yPos += 10;

    // Projects table
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

      autoTable(doc, {
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

      yPos = (doc as any).lastAutoTable.finalY + 10;

      // Detailed project information
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
            doc.text(
              `Progress: ${project.progress.completedPhases}/${project.progress.totalPhases} phases completed (${project.progress.completionPercentage}%)`,
              20,
              yPos
            );
            yPos += 6;
          }

          if (dto.includePayments && project.transactions) {
            doc.setFontSize(10);
            doc.text("Recent Transactions:", 20, yPos);
            yPos += 6;

            const transactionData = project.transactions
              .slice(0, 5)
              .map((t: any) => [
                t.description,
                this.formatCurrency(t.amount),
                t.type,
                t.date ? new Date(t.date).toLocaleDateString() : "N/A",
              ]);

            if (transactionData.length > 0) {
              autoTable(doc, {
                head: [["Description", "Amount", "Type", "Date"]],
                body: transactionData,
                startY: yPos,
                styles: { fontSize: 7 },
                headStyles: { fillColor: [52, 152, 219] },
              });
              yPos = (doc as any).lastAutoTable.finalY + 10;
            }
          }
        }
      }
    }

    // Save the PDF to file system
    const pdfOutput = doc.output("arraybuffer");
    fs.writeFileSync(filePath, Buffer.from(pdfOutput));
    const stats = fs.statSync(filePath);

    return {
      filePath,
      fileName,
      fileSize: stats.size,
    };
  }

  private async generateExcel(
    reportData: ReportData,
    dto: GenerateReportDto
  ): Promise<{ filePath: string; fileName: string; fileSize: number }> {
    const fileName = `finance-report-${Date.now()}.xlsx`;
    const filePath = path.join(process.cwd(), "uploads", "reports", fileName);

    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      { Metric: "Total Projects", Value: reportData.summary.totalProjects },
      { Metric: "Total Budget", Value: this.formatCurrency(reportData.summary.totalBudget) },
      { Metric: "Total Spent", Value: this.formatCurrency(reportData.summary.totalSpent) },
      { Metric: "Total Remaining", Value: this.formatCurrency(reportData.summary.totalRemaining) },
      { Metric: "Total Savings", Value: this.formatCurrency(reportData.summary.totalSavings) },
    ];
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");

    // Projects sheet
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
      Progress:
        dto.includeProgress && project.progress
          ? `${project.progress.completionPercentage}%`
          : "N/A",
    }));
    const projectsSheet = XLSX.utils.json_to_sheet(projectsData);
    XLSX.utils.book_append_sheet(wb, projectsSheet, "Projects");

    // Transactions sheet (if included)
    if (dto.includePayments) {
      const allTransactions: any[] = [];
      reportData.projects.forEach((project) => {
        if (project.transactions) {
          project.transactions.forEach((t: any) => {
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

    // Write file
    XLSX.writeFile(wb, filePath);
    const stats = fs.statSync(filePath);

    return {
      filePath,
      fileName,
      fileSize: stats.size,
    };
  }

  private async generateWord(
    reportData: ReportData,
    dto: GenerateReportDto
  ): Promise<{ filePath: string; fileName: string; fileSize: number }> {
    const fileName = `finance-report-${Date.now()}.docx`;
    const filePath = path.join(process.cwd(), "uploads", "reports", fileName);

    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const children: (Paragraph | Table)[] = [];

    // Title
    children.push(
      new Paragraph({
        text: "Finance Report - Ongoing Projects",
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
      })
    );

    // Summary section
    children.push(
      new Paragraph({
        text: "Summary",
        heading: HeadingLevel.HEADING_2,
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Total Projects: ${reportData.summary.totalProjects}`,
          }),
        ],
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Total Budget: ${this.formatCurrency(reportData.summary.totalBudget)}`,
          }),
        ],
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Total Spent: ${this.formatCurrency(reportData.summary.totalSpent)}`,
          }),
        ],
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Total Remaining: ${this.formatCurrency(reportData.summary.totalRemaining)}`,
          }),
        ],
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Total Savings: ${this.formatCurrency(reportData.summary.totalSavings)}`,
          }),
        ],
      })
    );

    // Projects section
    children.push(
      new Paragraph({
        text: "Projects",
        heading: HeadingLevel.HEADING_2,
      })
    );

    // Projects table
    if (reportData.projects.length > 0) {
      const tableRows: TableRow[] = [];

      // Header row
      const headerCells = [
        new TableCell({ children: [new Paragraph("Project")] }),
        new TableCell({ children: [new Paragraph("Budget")] }),
        new TableCell({ children: [new Paragraph("Spent")] }),
        new TableCell({ children: [new Paragraph("Remaining")] }),
        new TableCell({ children: [new Paragraph("Savings")] }),
        new TableCell({ children: [new Paragraph("Owner")] }),
      ];

      if (dto.includeProgress) {
        headerCells.push(
          new TableCell({ children: [new Paragraph("Progress")] })
        );
      }

      tableRows.push(new TableRow({ children: headerCells }));

      // Data rows
      reportData.projects.forEach((project) => {
        const cells = [
          new TableCell({ children: [new Paragraph(project.title)] }),
          new TableCell({
            children: [
              new Paragraph(this.formatCurrency(project.totalBudget || 0)),
            ],
          }),
          new TableCell({
            children: [
              new Paragraph(this.formatCurrency(project.spentAmount || 0)),
            ],
          }),
          new TableCell({
            children: [
              new Paragraph(this.formatCurrency(project.remainingBudget || 0)),
            ],
          }),
          new TableCell({
            children: [
              new Paragraph(this.formatCurrency(project.savings || 0)),
            ],
          }),
          new TableCell({ children: [new Paragraph(project.owner)] }),
        ];

        if (dto.includeProgress && project.progress) {
          cells.push(
            new TableCell({
              children: [
                new Paragraph(`${project.progress.completionPercentage}%`),
              ],
            })
          );
        }

        tableRows.push(new TableRow({ children: cells }));
      });

      children.push(
        new Table({
          rows: tableRows,
          width: {
            size: 100,
            type: WidthType.PERCENTAGE,
          },
        })
      );

      // Detailed project information
      if (dto.includePayments || dto.includeProgress) {
        reportData.projects.forEach((project) => {
          children.push(
            new Paragraph({
              text: project.title,
              heading: HeadingLevel.HEADING_3,
            })
          );

          if (dto.includeProgress && project.progress) {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Progress: ${project.progress.completedPhases}/${project.progress.totalPhases} phases completed (${project.progress.completionPercentage}%)`,
                  }),
                ],
              })
            );
          }

          if (dto.includePayments && project.transactions) {
            children.push(
              new Paragraph({
                text: "Recent Transactions:",
                heading: HeadingLevel.HEADING_4,
              })
            );

            const transactionRows: TableRow[] = [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph("Description")] }),
                  new TableCell({ children: [new Paragraph("Amount")] }),
                  new TableCell({ children: [new Paragraph("Type")] }),
                  new TableCell({ children: [new Paragraph("Date")] }),
                ],
              }),
            ];

            project.transactions.slice(0, 5).forEach((t: any) => {
              transactionRows.push(
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph(t.description)] }),
                    new TableCell({
                      children: [new Paragraph(this.formatCurrency(t.amount))],
                    }),
                    new TableCell({ children: [new Paragraph(t.type)] }),
                    new TableCell({
                      children: [
                        new Paragraph(
                          t.date ? new Date(t.date).toLocaleDateString() : "N/A"
                        ),
                      ],
                    }),
                  ],
                })
              );
            });

            children.push(
              new Table({
                rows: transactionRows,
                width: {
                  size: 100,
                  type: WidthType.PERCENTAGE,
                },
              })
            );
          }
        });
      }
    }

    // Create document
    const doc = new Document({
      sections: [
        {
          children,
        },
      ],
    });

    // Generate and save
    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(filePath, buffer);
    const stats = fs.statSync(filePath);

    return {
      filePath,
      fileName,
      fileSize: stats.size,
    };
  }

  private formatCurrency(amount: number): string {
    const numAmount = parseFloat(String(amount)) || 0;
    return new Intl.NumberFormat("en-TZ", {
      style: "currency",
      currency: "TZS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numAmount);
  }
}
