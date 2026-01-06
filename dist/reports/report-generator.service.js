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
var ReportGeneratorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportGeneratorService = void 0;
const common_1 = require("@nestjs/common");
const jspdf_1 = require("jspdf");
const jspdf_autotable_1 = require("jspdf-autotable");
const XLSX = require("xlsx");
const csv_writer_1 = require("csv-writer");
const fs = require("fs");
const path = require("path");
const report_entity_1 = require("../entities/report.entity");
const projects_service_1 = require("../projects/projects.service");
const users_service_1 = require("../users/users.service");
const activities_service_1 = require("../activities/activities.service");
const dashboard_service_1 = require("../dashboard/dashboard.service");
let ReportGeneratorService = ReportGeneratorService_1 = class ReportGeneratorService {
    constructor(projectsService, usersService, activitiesService, dashboardService) {
        this.projectsService = projectsService;
        this.usersService = usersService;
        this.activitiesService = activitiesService;
        this.dashboardService = dashboardService;
        this.logger = new common_1.Logger(ReportGeneratorService_1.name);
    }
    async generateReport(report) {
        this.logger.log(`Generating ${report.type} report: ${report.name}`);
        const reportData = await this.gatherReportData(report);
        switch (report.type) {
            case report_entity_1.ReportType.PDF:
                return this.generatePDF(reportData, report);
            case report_entity_1.ReportType.XLSX:
                return this.generateExcel(reportData, report);
            case report_entity_1.ReportType.CSV:
                return this.generateCSV(reportData, report);
            case report_entity_1.ReportType.JSON:
                return this.generateJSON(reportData, report);
            default:
                throw new Error(`Unsupported report type: ${report.type}`);
        }
    }
    async gatherReportData(report) {
        const parameters = report.parameters || {};
        const dataSources = parameters.dataSources || [
            "projects",
            "users",
            "activities",
        ];
        let allData = [];
        let columns = [];
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
    async getProjectsData(parameters) {
        const projects = await this.projectsService.adminList({
            search: parameters.search || "",
            status: parameters.projectStatus,
            page: 1,
            limit: 10000,
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
    async getUsersData(parameters) {
        const users = await this.usersService.adminList({
            search: parameters.search || "",
            role: parameters.userRoles,
            status: undefined,
            page: 1,
            limit: 10000,
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
    async getActivitiesData(parameters) {
        const activities = await this.activitiesService.adminList({
            userId: undefined,
            type: parameters.activityTypes,
            dateFrom: parameters.dateFrom,
            dateTo: parameters.dateTo,
            projectId: undefined,
            search: parameters.search || "",
            page: 1,
            limit: 10000,
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
    async getAnalyticsData(parameters) {
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
    async generatePDF(reportData, report) {
        const doc = new jspdf_1.jsPDF();
        const fileName = `${report.id}.pdf`;
        const filePath = path.join(process.cwd(), "uploads", "reports", fileName);
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        doc.setFontSize(20);
        doc.text(reportData.title, 14, 22);
        if (reportData.description) {
            doc.setFontSize(12);
            doc.text(reportData.description, 14, 32);
        }
        doc.setFontSize(10);
        doc.text(`Generated: ${reportData.metadata.generatedAt.toISOString()}`, 14, 42);
        doc.text(`Total Records: ${reportData.metadata.totalRecords}`, 14, 48);
        if (reportData.data.length > 0) {
            const tableData = reportData.data.map((row) => reportData.columns.map((col) => row[col] || ""));
            (0, jspdf_autotable_1.default)(doc, {
                head: [reportData.columns],
                body: tableData,
                startY: 55,
                styles: { fontSize: 8 },
                headStyles: { fillColor: [41, 128, 185] },
            });
        }
        doc.save(filePath);
        const stats = fs.statSync(filePath);
        return {
            filePath,
            fileName,
            fileSize: stats.size,
        };
    }
    async generateExcel(reportData, report) {
        const fileName = `${report.id}.xlsx`;
        const filePath = path.join(process.cwd(), "uploads", "reports", fileName);
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        const wb = XLSX.utils.book_new();
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
        if (reportData.data.length > 0) {
            const dataSheet = XLSX.utils.json_to_sheet(reportData.data);
            XLSX.utils.book_append_sheet(wb, dataSheet, "Data");
        }
        XLSX.writeFile(wb, filePath);
        const stats = fs.statSync(filePath);
        return {
            filePath,
            fileName,
            fileSize: stats.size,
        };
    }
    async generateCSV(reportData, report) {
        const fileName = `${report.id}.csv`;
        const filePath = path.join(process.cwd(), "uploads", "reports", fileName);
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        const csvWriter = (0, csv_writer_1.createObjectCsvWriter)({
            path: filePath,
            header: reportData.columns.map((col) => ({ id: col, title: col })),
        });
        await csvWriter.writeRecords(reportData.data);
        const stats = fs.statSync(filePath);
        return {
            filePath,
            fileName,
            fileSize: stats.size,
        };
    }
    async generateJSON(reportData, report) {
        const fileName = `${report.id}.json`;
        const filePath = path.join(process.cwd(), "uploads", "reports", fileName);
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        const jsonData = {
            metadata: reportData.metadata,
            title: reportData.title,
            description: reportData.description,
            columns: reportData.columns,
            data: reportData.data,
        };
        fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));
        const stats = fs.statSync(filePath);
        return {
            filePath,
            fileName,
            fileSize: stats.size,
        };
    }
};
exports.ReportGeneratorService = ReportGeneratorService;
exports.ReportGeneratorService = ReportGeneratorService = ReportGeneratorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [projects_service_1.ProjectsService,
        users_service_1.UsersService,
        activities_service_1.ActivitiesService,
        dashboard_service_1.DashboardService])
], ReportGeneratorService);
//# sourceMappingURL=report-generator.service.js.map