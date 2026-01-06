import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { createObjectCsvWriter } from "csv-writer";
import * as fs from "fs";
import * as path from "path";
import { ReportType, Report } from "../entities/report.entity";
import { ProjectsService } from "../projects/projects.service";
import { UsersService } from "../users/users.service";
import { ActivitiesService } from "../activities/activities.service";
import { DashboardService } from "../dashboard/dashboard.service";

interface ReportData {
  title: string;
  description: string;
  data: any[];
  columns: string[];
  metadata: {
    generatedAt: Date;
    dateFrom?: Date;
    dateTo?: Date;
    totalRecords: number;
    parameters: any;
  };
}

@Injectable()
export class ReportGeneratorService {
  private readonly logger = new Logger(ReportGeneratorService.name);

  constructor(
    private readonly projectsService: ProjectsService,
    private readonly usersService: UsersService,
    private readonly activitiesService: ActivitiesService,
    private readonly dashboardService: DashboardService
  ) {}

  async generateReport(
    report: Report
  ): Promise<{ filePath: string; fileName: string; fileSize: number }> {
    this.logger.log(`Generating ${report.type} report: ${report.name}`);

    // Gather data based on parameters
    const reportData = await this.gatherReportData(report);

    // Generate file based on type
    switch (report.type) {
      case ReportType.PDF:
        return this.generatePDF(reportData, report);
      case ReportType.XLSX:
        return this.generateExcel(reportData, report);
      case ReportType.CSV:
        return this.generateCSV(reportData, report);
      case ReportType.JSON:
        return this.generateJSON(reportData, report);
      default:
        throw new Error(`Unsupported report type: ${report.type}`);
    }
  }

  private async gatherReportData(report: Report): Promise<ReportData> {
    const parameters = report.parameters || {};
    const dataSources = parameters.dataSources || [
      "projects",
      "users",
      "activities",
    ];
    let allData: any[] = [];
    let columns: string[] = [];

    // Gather data from different sources
    if (dataSources.includes("projects")) {
      const projectsData = await this.getProjectsData(parameters);
      allData = allData.concat(projectsData.data);
      columns = [...new Set([...columns, ...projectsData.columns])];
    }

    if (dataSources.includes("users")) {
      const usersData = await this.getUsersData(parameters);
      allData = allData.concat(usersData.data);
      columns = [...new Set([...columns, ...usersData.columns])];
    }

    if (dataSources.includes("activities")) {
      const activitiesData = await this.getActivitiesData(parameters);
      allData = allData.concat(activitiesData.data);
      columns = [...new Set([...columns, ...activitiesData.columns])];
    }

    if (dataSources.includes("analytics")) {
      const analyticsData = await this.getAnalyticsData(parameters);
      allData = allData.concat(analyticsData.data);
      columns = [...new Set([...columns, ...analyticsData.columns])];
    }

    // Apply sorting if specified
    if (parameters.sortBy) {
      allData.sort((a, b) => {
        const aVal = a[parameters.sortBy];
        const bVal = b[parameters.sortBy];
        const order = parameters.sortOrder === "asc" ? 1 : -1;
        return aVal > bVal ? order : -order;
      });
    }

    return {
      title: report.name,
      description: report.description || "",
      data: allData,
      columns,
      metadata: {
        generatedAt: new Date(),
        dateFrom: report.dateFrom,
        dateTo: report.dateTo,
        totalRecords: allData.length,
        parameters: report.parameters,
      },
    };
  }

  private async getProjectsData(
    parameters: any
  ): Promise<{ data: any[]; columns: string[] }> {
    const projects = await this.projectsService.adminList({
      search: parameters.search || "",
      status: parameters.projectStatus,
      page: 1,
      limit: 10000, // Get all projects
    });

    const data = projects.items.map((project) => ({
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      owner: project.owner?.display_name || "Unknown",
      members: project.members?.map((m) => m.display_name).join(", ") || "",
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      type: "project",
    }));

    return {
      data,
      columns: [
        "id",
        "name",
        "description",
        "status",
        "owner",
        "members",
        "createdAt",
        "updatedAt",
        "type",
      ],
    };
  }

  private async getUsersData(
    parameters: any
  ): Promise<{ data: any[]; columns: string[] }> {
    const users = await this.usersService.adminList({
      search: parameters.search || "",
      role: parameters.userRoles,
      status: undefined,
      page: 1,
      limit: 10000, // Get all users
    });

    const data = users.users.map((user) => ({
      id: user.id,
      name: user.display_name,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      type: "user",
    }));

    return {
      data,
      columns: [
        "id",
        "name",
        "email",
        "role",
        "status",
        "createdAt",
        "updatedAt",
        "type",
      ],
    };
  }

  private async getActivitiesData(
    parameters: any
  ): Promise<{ data: any[]; columns: string[] }> {
    const activities = await this.activitiesService.adminList({
      userId: undefined,
      type: parameters.activityTypes,
      dateFrom: parameters.dateFrom,
      dateTo: parameters.dateTo,
      projectId: undefined,
      search: parameters.search || "",
      page: 1,
      limit: 10000, // Get all activities
    });

    const data = activities.items.map((activity) => ({
      id: activity.id,
      type: activity.type,
      description: activity.description,
      user: activity.user?.name || "Unknown",
      project: activity.project?.name || "Unknown",
      timestamp: activity.timestamp,
      activityType: "activity",
    }));

    return {
      data,
      columns: [
        "id",
        "type",
        "description",
        "user",
        "project",
        "timestamp",
        "activityType",
      ],
    };
  }

  private async getAnalyticsData(
    parameters: any
  ): Promise<{ data: any[]; columns: string[] }> {
    // Placeholder for analytics data - implement based on your analytics requirements
    const data = [
      {
        metric: "Total Projects",
        value: 10,
        type: "analytics",
        generatedAt: new Date(),
      },
      {
        metric: "Active Users",
        value: 25,
        type: "analytics",
        generatedAt: new Date(),
      },
    ];

    return {
      data,
      columns: ["metric", "value", "type", "generatedAt"],
    };
  }

  private async generatePDF(
    reportData: ReportData,
    report: Report
  ): Promise<{ filePath: string; fileName: string; fileSize: number }> {
    const doc = new jsPDF();
    const fileName = `${report.id}.pdf`;
    const filePath = path.join(process.cwd(), "uploads", "reports", fileName);

    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Add title
    doc.setFontSize(20);
    doc.text(reportData.title, 14, 22);

    // Add description
    if (reportData.description) {
      doc.setFontSize(12);
      doc.text(reportData.description, 14, 32);
    }

    // Add metadata
    doc.setFontSize(10);
    doc.text(
      `Generated: ${reportData.metadata.generatedAt.toISOString()}`,
      14,
      42
    );
    doc.text(`Total Records: ${reportData.metadata.totalRecords}`, 14, 48);

    // Add table
    if (reportData.data.length > 0) {
      const tableData = reportData.data.map((row) =>
        reportData.columns.map((col) => row[col] || "")
      );

      autoTable(doc, {
        head: [reportData.columns],
        body: tableData,
        startY: 55,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] },
      });
    }

    // Save the PDF
    doc.save(filePath);
    const stats = fs.statSync(filePath);

    return {
      filePath,
      fileName,
      fileSize: stats.size,
    };
  }

  private async generateExcel(
    reportData: ReportData,
    report: Report
  ): Promise<{ filePath: string; fileName: string; fileSize: number }> {
    const fileName = `${report.id}.xlsx`;
    const filePath = path.join(process.cwd(), "uploads", "reports", fileName);

    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Add metadata sheet
    const metadataSheet = XLSX.utils.json_to_sheet([
      { Property: "Report Name", Value: reportData.title },
      { Property: "Description", Value: reportData.description },
      {
        Property: "Generated At",
        Value: reportData.metadata.generatedAt.toISOString(),
      },
      { Property: "Total Records", Value: reportData.metadata.totalRecords },
      {
        Property: "Date From",
        Value: reportData.metadata.dateFrom?.toISOString() || "N/A",
      },
      {
        Property: "Date To",
        Value: reportData.metadata.dateTo?.toISOString() || "N/A",
      },
    ]);
    XLSX.utils.book_append_sheet(wb, metadataSheet, "Metadata");

    // Add data sheet
    if (reportData.data.length > 0) {
      const dataSheet = XLSX.utils.json_to_sheet(reportData.data);
      XLSX.utils.book_append_sheet(wb, dataSheet, "Data");
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

  private async generateCSV(
    reportData: ReportData,
    report: Report
  ): Promise<{ filePath: string; fileName: string; fileSize: number }> {
    const fileName = `${report.id}.csv`;
    const filePath = path.join(process.cwd(), "uploads", "reports", fileName);

    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Create CSV writer
    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: reportData.columns.map((col) => ({ id: col, title: col })),
    });

    // Write data
    await csvWriter.writeRecords(reportData.data);
    const stats = fs.statSync(filePath);

    return {
      filePath,
      fileName,
      fileSize: stats.size,
    };
  }

  private async generateJSON(
    reportData: ReportData,
    report: Report
  ): Promise<{ filePath: string; fileName: string; fileSize: number }> {
    const fileName = `${report.id}.json`;
    const filePath = path.join(process.cwd(), "uploads", "reports", fileName);

    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Create JSON structure
    const jsonData = {
      metadata: reportData.metadata,
      title: reportData.title,
      description: reportData.description,
      columns: reportData.columns,
      data: reportData.data,
    };

    // Write file
    fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));
    const stats = fs.statSync(filePath);

    return {
      filePath,
      fileName,
      fileSize: stats.size,
    };
  }
}
