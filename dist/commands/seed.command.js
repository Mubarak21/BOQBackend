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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeedCommand = exports.SeedService = void 0;
const nestjs_command_1 = require("nestjs-command");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../entities/user.entity");
const department_entity_1 = require("../entities/department.entity");
const project_entity_1 = require("../entities/project.entity");
const phase_entity_1 = require("../entities/phase.entity");
const contractor_phase_entity_1 = require("../entities/contractor-phase.entity");
const sub_contractor_phase_entity_1 = require("../entities/sub-contractor-phase.entity");
const task_entity_1 = require("../entities/task.entity");
const budget_category_entity_1 = require("../finance/entities/budget-category.entity");
const project_transaction_entity_1 = require("../finance/entities/project-transaction.entity");
const project_savings_entity_1 = require("../finance/entities/project-savings.entity");
const budget_alert_entity_1 = require("../finance/entities/budget-alert.entity");
const admin_entity_1 = require("../entities/admin.entity");
const activity_entity_1 = require("../entities/activity.entity");
const report_entity_1 = require("../entities/report.entity");
const comment_entity_1 = require("../entities/comment.entity");
const complaint_entity_1 = require("../entities/complaint.entity");
const sub_phase_entity_1 = require("../entities/sub-phase.entity");
const inventory_entity_1 = require("../entities/inventory.entity");
const project_financial_summary_entity_1 = require("../entities/project-financial-summary.entity");
const supplier_entity_1 = require("../entities/supplier.entity");
const project_metadata_entity_1 = require("../entities/project-metadata.entity");
const project_settings_entity_1 = require("../entities/project-settings.entity");
const phase_financial_summary_entity_1 = require("../entities/phase-financial-summary.entity");
const user_preferences_entity_1 = require("../entities/user-preferences.entity");
const user_session_entity_1 = require("../entities/user-session.entity");
const transaction_attachment_entity_1 = require("../entities/transaction-attachment.entity");
const transaction_approval_history_entity_1 = require("../entities/transaction-approval-history.entity");
const audit_log_entity_1 = require("../entities/audit-log.entity");
const inventory_usage_log_entity_1 = require("../entities/inventory-usage-log.entity");
const project_boq_entity_1 = require("../entities/project-boq.entity");
const projects_service_1 = require("../projects/projects.service");
const project_phase_service_1 = require("../projects/services/project-phase.service");
const subphases_service_1 = require("../projects/subphases.service");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
let SeedService = class SeedService {
    constructor(userRepository, departmentRepository, projectRepository, phaseRepository, contractorPhaseRepository, subContractorPhaseRepository, taskRepository, budgetCategoryRepository, transactionRepository, savingsRepository, alertRepository, adminRepository, activityRepository, reportRepository, commentRepository, complaintRepository, subPhaseRepository, inventoryRepository, financialSummaryRepository, supplierRepository, projectMetadataRepository, projectSettingsRepository, phaseFinancialSummaryRepository, userPreferencesRepository, userSessionRepository, transactionAttachmentRepository, transactionApprovalHistoryRepository, auditLogRepository, inventoryUsageLogRepository, projectBoqRepository, projectsService, projectPhaseService, subPhasesService) {
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.projectRepository = projectRepository;
        this.phaseRepository = phaseRepository;
        this.contractorPhaseRepository = contractorPhaseRepository;
        this.subContractorPhaseRepository = subContractorPhaseRepository;
        this.taskRepository = taskRepository;
        this.budgetCategoryRepository = budgetCategoryRepository;
        this.transactionRepository = transactionRepository;
        this.savingsRepository = savingsRepository;
        this.alertRepository = alertRepository;
        this.adminRepository = adminRepository;
        this.activityRepository = activityRepository;
        this.reportRepository = reportRepository;
        this.commentRepository = commentRepository;
        this.complaintRepository = complaintRepository;
        this.subPhaseRepository = subPhaseRepository;
        this.inventoryRepository = inventoryRepository;
        this.financialSummaryRepository = financialSummaryRepository;
        this.supplierRepository = supplierRepository;
        this.projectMetadataRepository = projectMetadataRepository;
        this.projectSettingsRepository = projectSettingsRepository;
        this.phaseFinancialSummaryRepository = phaseFinancialSummaryRepository;
        this.userPreferencesRepository = userPreferencesRepository;
        this.userSessionRepository = userSessionRepository;
        this.transactionAttachmentRepository = transactionAttachmentRepository;
        this.transactionApprovalHistoryRepository = transactionApprovalHistoryRepository;
        this.auditLogRepository = auditLogRepository;
        this.inventoryUsageLogRepository = inventoryUsageLogRepository;
        this.projectBoqRepository = projectBoqRepository;
        this.projectsService = projectsService;
        this.projectPhaseService = projectPhaseService;
        this.subPhasesService = subPhasesService;
    }
    async seed() {
        const existingUsersCount = await this.userRepository.count();
        const existingProjectsCount = await this.projectRepository.count();
        if (existingUsersCount > 0 || existingProjectsCount > 0) {
            if (process.env.FORCE_SEED !== 'true') {
                return;
            }
        }
        const departments = await this.seedDepartments();
        const users = await this.seedUsers(departments);
        const admins = await this.seedAdmins();
        const projects = await this.seedProjects(users, departments);
        const phases = await this.seedPhases(projects, users);
        const tasks = await this.seedTasks(projects, phases, users);
        await this.seedFinancialData(projects, users);
        await this.seedActivities(users, projects, tasks);
        await this.seedReports(users);
        await this.seedComments(users, projects, tasks);
        await this.seedComplaints(users, projects, phases);
        await this.seedInventoryItems(users, projects);
        await this.seedUserPreferences(users);
        await this.seedUserSessions(users);
        await this.seedProjectMetadata(projects);
        await this.seedProjectSettings(projects);
        await this.seedPhaseFinancialSummaries(phases);
        await this.seedTransactionAttachments(projects);
        await this.seedTransactionApprovalHistory(projects);
        await this.seedAuditLogs(users, projects);
        await this.seedInventoryUsageLogs(users, projects, phases);
        await this.seedBOQData(projects, users);
        console.log("\n✅ Database seeding completed successfully!");
    }
    async seedDepartments() {
        const departmentData = [
            {
                name: "Uhandisi na Majengo",
                description: "Engineering and Construction",
            },
            { name: "Fedha na Hesabu", description: "Finance and Accounting" },
            { name: "Utawala na Rasilimali", description: "HR and Administration" },
            {
                name: "Umasishano na Uhusiano",
                description: "Marketing and Relations",
            },
            {
                name: "Teknolojia na Mawasiliano",
                description: "IT and Communications",
            },
            { name: "Mipango na Maendeleo", description: "Planning and Development" },
        ];
        const departments = [];
        for (const deptData of departmentData) {
            let dept = await this.departmentRepository.findOne({
                where: { name: deptData.name },
            });
            if (!dept) {
                dept = this.departmentRepository.create(deptData);
                await this.departmentRepository.save(dept);
            }
            departments.push(dept);
        }
        return departments;
    }
    async seedUsers(departments) {
        const tanzanianUsers = [
            {
                email: "admin@kipimo.co.tz",
                password: "admin123",
                display_name: "Mwalimu Hassan Kikwete",
                role: user_entity_1.UserRole.SUPER_ADMIN,
                department: departments[0],
                bio: "Mkurugenzi Mkuu wa Mradi wa Ujenzi Tanzania",
                phone: "+255 754 123 456",
                location: "Dar es Salaam",
                status: "active",
            },
            {
                email: "project.manager@kipimo.co.tz",
                password: "pm123",
                display_name: "Eng. Fatma Mohammed",
                role: user_entity_1.UserRole.USER,
                department: departments[0],
                bio: "Meneja Miradi wa Uhandisi",
                phone: "+255 765 234 567",
                location: "Dodoma",
                status: "active",
            },
            {
                email: "finance.manager@kipimo.co.tz",
                password: "fm123",
                display_name: "CPA John Mwanga",
                role: user_entity_1.UserRole.FINANCE,
                department: departments[1],
                bio: "Meneja Fedha na Hesabu",
                phone: "+255 776 345 678",
                location: "Mwanza",
                status: "active",
            },
            {
                email: "hr.manager@kipimo.co.tz",
                password: "hr123",
                display_name: "Dkt. Amina Juma",
                role: user_entity_1.UserRole.USER,
                department: departments[2],
                bio: "Meneja Rasilimali Watu",
                phone: "+255 787 456 789",
                location: "Arusha",
                status: "active",
            },
            {
                email: "marketing@kipimo.co.tz",
                password: "mk123",
                display_name: "Said Bakari",
                role: user_entity_1.UserRole.USER,
                department: departments[3],
                bio: "Afisa Umasishano",
                phone: "+255 798 567 890",
                location: "Zanzibar",
                status: "active",
            },
            {
                email: "it.manager@kipimo.co.tz",
                password: "it123",
                display_name: "Eng. Grace Mwangi",
                role: user_entity_1.UserRole.USER,
                department: departments[4],
                bio: "Meneja Teknolojia",
                phone: "+255 712 678 901",
                location: "Dar es Salaam",
                status: "active",
            },
            {
                email: "planning@kipimo.co.tz",
                password: "pl123",
                display_name: "Mwalimu Robert Nyerere",
                role: user_entity_1.UserRole.USER,
                department: departments[5],
                bio: "Afisa Mipango",
                phone: "+255 723 789 012",
                location: "Dodoma",
                status: "active",
            },
            {
                email: "contractor1@kipimo.co.tz",
                password: "con123",
                display_name: "Mfanyakazi Peter Msigwa",
                role: user_entity_1.UserRole.CONTRACTOR,
                department: departments[0],
                bio: "Mkontrakta Ujenzi",
                phone: "+255 734 890 123",
                location: "Mbeya",
                status: "active",
            },
            {
                email: "subcontractor1@kipimo.co.tz",
                password: "sub123",
                display_name: "Eng. John Mwangi",
                role: user_entity_1.UserRole.SUB_CONTRACTOR,
                department: departments[0],
                bio: "Mkontrakta Umeme - Electrical Sub Contractor specializing in residential and commercial electrical installations",
                phone: "+255 756 012 345",
                location: "Dar es Salaam",
                status: "active",
            },
            {
                email: "subcontractor2@kipimo.co.tz",
                password: "sub456",
                display_name: "Eng. Sarah Kimani",
                role: user_entity_1.UserRole.SUB_CONTRACTOR,
                department: departments[0],
                bio: "Electrical Sub Contractor - Expert in industrial wiring and electrical systems",
                phone: "+255 767 123 456",
                location: "Arusha",
                status: "active",
            },
            {
                email: "architect@kipimo.co.tz",
                password: "arch123",
                display_name: "Arch. Mary Kilonzo",
                role: user_entity_1.UserRole.USER,
                department: departments[0],
                bio: "Mbunifu Majengo",
                phone: "+255 745 901 234",
                location: "Morogoro",
                status: "active",
            },
            {
                email: "supervisor@kipimo.co.tz",
                password: "sup123",
                display_name: "Eng. Daniel Mwalimu",
                role: user_entity_1.UserRole.USER,
                department: departments[0],
                bio: "Msimamizi Ujenzi",
                phone: "+255 756 012 345",
                location: "Iringa",
                status: "active",
            },
            {
                email: "procurement@kipimo.co.tz",
                password: "proc123",
                display_name: "Agnes Mwambapa",
                role: user_entity_1.UserRole.USER,
                department: departments[1],
                bio: "Afisa Ununuzi",
                phone: "+255 767 123 456",
                location: "Tanga",
                status: "active",
            },
            {
                email: "quality@kipimo.co.tz",
                password: "qa123",
                display_name: "Eng. Joseph Msaki",
                role: user_entity_1.UserRole.USER,
                department: departments[0],
                bio: "Afisa Ubora",
                phone: "+255 778 234 567",
                location: "Kigoma",
                status: "active",
            },
            {
                email: "logistics@kipimo.co.tz",
                password: "log123",
                display_name: "Hamisi Vuai",
                role: user_entity_1.UserRole.USER,
                department: departments[5],
                bio: "Afisa Usafirishaji",
                phone: "+255 789 345 678",
                location: "Mtwara",
                status: "active",
            },
            {
                email: "consultant@kipimo.co.tz",
                password: "cons123",
                display_name: "Dkt. Elizabeth Mwenda",
                role: user_entity_1.UserRole.CONSULTANT,
                department: departments[0],
                bio: "Mshauri Uhandisi",
                phone: "+255 701 456 789",
                location: "Kilimanjaro",
                status: "active",
            },
            {
                email: "junior@kipimo.co.tz",
                password: "jun123",
                display_name: "Emanuel Makongoro",
                role: user_entity_1.UserRole.USER,
                department: departments[0],
                bio: "Mhandisi Mwanzo",
                phone: "+255 713 567 890",
                location: "Shinyanga",
                status: "active",
            },
            {
                email: "former@kipimo.co.tz",
                password: "old123",
                display_name: "Ahmed Mwalimu",
                role: user_entity_1.UserRole.USER,
                department: departments[2],
                bio: "Mwajiri wa zamani",
                phone: "+255 724 678 901",
                location: "Lindi",
                status: "inactive",
            },
        ];
        const users = [];
        for (const userData of tanzanianUsers) {
            let user = await this.userRepository.findOne({
                where: { email: userData.email },
            });
            if (!user) {
                const hashedPassword = await bcrypt.hash(userData.password, 10);
                user = this.userRepository.create({
                    email: userData.email,
                    password: hashedPassword,
                    display_name: userData.display_name,
                    role: userData.role,
                    department_id: userData.department.id,
                    bio: userData.bio,
                    status: userData.status,
                });
                await this.userRepository.save(user);
                console.log(`   ✓ Created user: ${userData.display_name} (${userData.email})`);
            }
            users.push(user);
        }
        return users;
    }
    async seedAdmins() {
        const adminUsers = [
            {
                email: "superadmin@kipimo.co.tz",
                password: "superadmin123",
                display_name: "Mkurugenzi Mkuu - Mwalimu Nyerere",
                status: "active",
            },
            {
                email: "admin.finance@kipimo.co.tz",
                password: "adminfin123",
                display_name: "Mkuu wa Fedha - CPA Mwanga",
                status: "active",
            },
        ];
        const admins = [];
        for (const adminData of adminUsers) {
            let admin = await this.adminRepository.findOne({
                where: { email: adminData.email },
            });
            if (!admin) {
                const hashedPassword = await bcrypt.hash(adminData.password, 10);
                admin = this.adminRepository.create({
                    email: adminData.email,
                    password: hashedPassword,
                    display_name: adminData.display_name,
                    status: adminData.status,
                    last_login: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
                });
                await this.adminRepository.save(admin);
            }
            admins.push(admin);
        }
        return admins;
    }
    async seedProjects(users, departments) {
        console.log("\n🏗️  Seeding Projects using ProjectsService...");
        const tanzanianProjects = [
            {
                title: "Mradi wa Barabara ya Dar es Salaam - Dodoma",
                description: "Ujenzi wa barabara ya lami kutoka Dar es Salaam hadi Dodoma kwa umbali wa km 450",
                status: project_entity_1.ProjectStatus.IN_PROGRESS,
                priority: project_entity_1.ProjectPriority.HIGH,
                totalBudget: 125000000000,
                location: "Tanzania Mainland",
                tags: ["barabara", "infrastructure", "lami"],
                department: departments[0],
            },
            {
                title: "Ujenzi wa Hospitali ya Rufaa Mwanza",
                description: "Ujenzi wa hospitali ya rufaa ya kisasa huko Mwanza na vifaa vya hali ya juu",
                status: project_entity_1.ProjectStatus.IN_PROGRESS,
                priority: project_entity_1.ProjectPriority.URGENT,
                totalBudget: 75000000000,
                location: "Mwanza",
                tags: ["hospitali", "afya", "ujenzi"],
                department: departments[0],
            },
            {
                title: "Mradi wa Uwandani wa Kilimo Dodoma",
                description: "Uongozi wa uwandani wa umwagiliaji na mazao ya kilimo kwa wakulima 5000",
                status: project_entity_1.ProjectStatus.PLANNING,
                priority: project_entity_1.ProjectPriority.MEDIUM,
                totalBudget: 25000000000,
                location: "Dodoma",
                tags: ["kilimo", "umwagiliaji", "maendeleo"],
                department: departments[0],
            },
            {
                title: "Mfumo wa Elimu ya Kidijitali Tanzania",
                description: "Kuanzisha mfumo wa elimu ya kidijitali katika shule 1000 nchini",
                status: project_entity_1.ProjectStatus.IN_PROGRESS,
                priority: project_entity_1.ProjectPriority.HIGH,
                totalBudget: 50000000000,
                location: "Tanzania",
                tags: ["elimu", "teknolojia", "kidijitali"],
                department: departments[0],
            },
            {
                title: "Ujenzi wa Bandari la Mtwara",
                description: "Upanuzi na uboreshaji wa bandari la Mtwara kwa mizigo na wasafiri",
                status: project_entity_1.ProjectStatus.IN_PROGRESS,
                priority: project_entity_1.ProjectPriority.HIGH,
                totalBudget: 200000000000,
                location: "Mtwara",
                tags: ["bandari", "bahari", "biashara"],
                department: departments[0],
            },
            {
                title: "Mradi wa Umeme wa Jua Singida",
                description: "Ujenzi wa kituo cha umeme wa jua chenye uwezo wa MW 100 huko Singida",
                status: project_entity_1.ProjectStatus.PLANNING,
                priority: project_entity_1.ProjectPriority.MEDIUM,
                totalBudget: 80000000000,
                location: "Singida",
                tags: ["umeme", "jua", "nishati"],
                department: departments[0],
            },
            {
                title: "Ujenzi wa Shule za Sekondari 50 Pemba",
                description: "Ujenzi wa shule 50 za sekondari katika kisiwa cha Pemba",
                status: project_entity_1.ProjectStatus.COMPLETED,
                priority: project_entity_1.ProjectPriority.MEDIUM,
                totalBudget: 30000000000,
                location: "Pemba, Zanzibar",
                tags: ["elimu", "ujenzi", "shule"],
                department: departments[0],
            },
            {
                title: "Mradi wa Maji Safi Kigoma",
                description: "Ujenzi wa mfumo wa usambazaji maji safi kwa wakazi 200,000 Kigoma",
                status: project_entity_1.ProjectStatus.IN_PROGRESS,
                priority: project_entity_1.ProjectPriority.HIGH,
                totalBudget: 35000000000,
                location: "Kigoma",
                tags: ["maji", "afya", "mazingira"],
                department: departments[0],
            },
            {
                title: "Kampeni ya Umasishani wa Utalii",
                description: "Kampeni ya kuongeza utalii wa kimataifa Tanzania kwa miaka 3",
                status: project_entity_1.ProjectStatus.IN_PROGRESS,
                priority: project_entity_1.ProjectPriority.MEDIUM,
                totalBudget: 15000000000,
                location: "Tanzania",
                tags: ["utalii", "umasishani", "uchumi"],
                department: departments[0],
            },
            {
                title: "Ujenzi wa Uwanja wa Ndege Songwe",
                description: "Ujenzi wa uwanja wa ndege wa kimataifa huko Songwe, Mbeya",
                status: project_entity_1.ProjectStatus.COMPLETED,
                priority: project_entity_1.ProjectPriority.HIGH,
                totalBudget: 180000000000,
                location: "Mbeya",
                tags: ["ndege", "uwanja", "kimataifa"],
                department: departments[0],
            },
            {
                title: "Mradi wa Maendeleo ya Vijiji 100",
                description: "Kujenga miundombinu ya msingi katika vijiji 100 vya umaarufu",
                status: project_entity_1.ProjectStatus.ON_HOLD,
                priority: project_entity_1.ProjectPriority.LOW,
                totalBudget: 40000000000,
                location: "Tanzania",
                tags: ["vijiji", "maendeleo", "miundombinu"],
                department: departments[0],
            },
            {
                title: "Ujenzi wa Kituo cha Utafiti Kilimo",
                description: "Ujenzi wa kituo cha utafiti wa kilimo chenye vifaa vya kisasa",
                status: project_entity_1.ProjectStatus.CANCELLED,
                priority: project_entity_1.ProjectPriority.LOW,
                totalBudget: 12000000000,
                location: "Morogoro",
                tags: ["kilimo", "utafiti", "sayansi"],
                department: departments[0],
            },
        ];
        const consultants = users.filter(u => u.role === user_entity_1.UserRole.CONSULTANT && u.status === "active");
        if (consultants.length === 0) {
            console.log("   ⚠️  No consultants found. Projects need consultants as owners.");
            return [];
        }
        const projects = [];
        for (let i = 0; i < tanzanianProjects.length; i++) {
            const projectData = tanzanianProjects[i];
            const owner = consultants[i % consultants.length];
            let project = await this.projectRepository.findOne({
                where: { title: projectData.title },
            });
            if (!project) {
                const createProjectDto = {
                    title: projectData.title,
                    description: projectData.description,
                    status: projectData.status,
                    priority: projectData.priority,
                    totalAmount: projectData.totalBudget,
                    tags: projectData.tags,
                    start_date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
                    end_date: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
                };
                const collaboratorCount = 1 + Math.floor(Math.random() * 2);
                const availableConsultants = consultants.filter((u) => u.id !== owner.id && u.status === "active");
                const selectedCollaborators = availableConsultants
                    .sort(() => 0.5 - Math.random())
                    .slice(0, collaboratorCount);
                createProjectDto.collaborator_ids = selectedCollaborators.map(u => u.id);
                project = await this.projectsService.create(createProjectDto, owner);
                const financialSummary = await this.financialSummaryRepository.findOne({
                    where: { project_id: project.id },
                });
                if (financialSummary) {
                    let spentAmount = 0;
                    let estimatedSavings = 0;
                    let financialStatus = "on_track";
                    switch (projectData.status) {
                        case project_entity_1.ProjectStatus.COMPLETED:
                            spentAmount =
                                projectData.totalBudget * (0.85 + Math.random() * 0.1);
                            estimatedSavings = projectData.totalBudget - spentAmount;
                            financialStatus = "excellent";
                            break;
                        case project_entity_1.ProjectStatus.IN_PROGRESS:
                            spentAmount = projectData.totalBudget * (0.4 + Math.random() * 0.4);
                            estimatedSavings =
                                projectData.totalBudget * (0.05 + Math.random() * 0.1);
                            financialStatus = Math.random() > 0.7 ? "warning" : "on_track";
                            break;
                        case project_entity_1.ProjectStatus.PLANNING:
                            spentAmount =
                                projectData.totalBudget * (0.05 + Math.random() * 0.1);
                            estimatedSavings = 0;
                            financialStatus = "on_track";
                            break;
                        case project_entity_1.ProjectStatus.ON_HOLD:
                            spentAmount = projectData.totalBudget * (0.2 + Math.random() * 0.3);
                            estimatedSavings = 0;
                            financialStatus = "warning";
                            break;
                        case project_entity_1.ProjectStatus.CANCELLED:
                            spentAmount = projectData.totalBudget * (0.1 + Math.random() * 0.2);
                            estimatedSavings = -spentAmount;
                            financialStatus = "over_budget";
                            break;
                    }
                    financialSummary.spentAmount = spentAmount;
                    financialSummary.estimatedSavings = estimatedSavings;
                    financialSummary.financialStatus = financialStatus;
                    await this.financialSummaryRepository.save(financialSummary);
                }
                console.log(`   ✓ Created project: ${project.title} (Budget: TSh ${(projectData.totalBudget / 1000000000).toFixed(1)}B)`);
            }
            projects.push(project);
        }
        console.log(`   ✓ Created ${projects.length} projects using ProjectsService`);
        return projects;
    }
    async seedPhases(projects, users) {
        console.log("\n📋 Seeding Phases using ProjectPhaseService...");
        const phaseTemplates = [
            {
                title: "Mipango na Uchunguzi",
                description: "Uchambuzi wa awali na mipango ya mradi",
            },
            {
                title: "Ubunifu na Miundo",
                description: "Ubunifu wa kiufundi na miundo ya kiteknolojia",
            },
            {
                title: "Utayarishaji wa Mazingira",
                description: "Utayarishaji wa ardhi na mazingira ya ujenzi",
            },
            {
                title: "Ujenzi wa Msingi",
                description: "Ujenzi wa misingi na miundombinu ya msingi",
            },
            {
                title: "Ujenzi wa Maumbo",
                description: "Ujenzi wa maumbo makuu ya mradi",
            },
            {
                title: "Umalishaji na Upimaji",
                description: "Umalishaji wa mradi na upimaji wa ubora",
            },
        ];
        const consultants = users.filter(u => u.role === user_entity_1.UserRole.CONSULTANT && u.status === "active");
        if (consultants.length === 0) {
            console.log("   ⚠️  No consultants found. Skipping phase creation.");
            return [];
        }
        const allPhases = [];
        for (const project of projects) {
            const numPhases = 2 + Math.floor(Math.random() * 3);
            const financialSummary = await this.financialSummaryRepository.findOne({
                where: { project_id: project.id },
            });
            const projectBudget = financialSummary?.totalBudget || project.totalAmount || 0;
            const phaseBudget = projectBudget / (numPhases + 1);
            for (let i = 0; i < numPhases; i++) {
                const phaseTemplate = phaseTemplates[i % phaseTemplates.length];
                const consultant = consultants[Math.floor(Math.random() * consultants.length)];
                let status = phase_entity_1.PhaseStatus.NOT_STARTED;
                let progress = 0;
                if (project.status === project_entity_1.ProjectStatus.COMPLETED) {
                    if (i < numPhases / 2) {
                        status = phase_entity_1.PhaseStatus.COMPLETED;
                        progress = 100;
                    }
                }
                else if (project.status === project_entity_1.ProjectStatus.IN_PROGRESS) {
                    if (i === 0) {
                        status = phase_entity_1.PhaseStatus.IN_PROGRESS;
                        progress = 30 + Math.random() * 50;
                    }
                    else if (i === 1 && Math.random() > 0.5) {
                        status = phase_entity_1.PhaseStatus.IN_PROGRESS;
                        progress = 10 + Math.random() * 40;
                    }
                }
                else if (project.status === project_entity_1.ProjectStatus.PLANNING && i === 0) {
                    status = phase_entity_1.PhaseStatus.IN_PROGRESS;
                    progress = 20 + Math.random() * 30;
                }
                const createPhaseDto = {
                    title: `${phaseTemplate.title} - ${project.title.split(" ").slice(0, 3).join(" ")}`,
                    description: `${phaseTemplate.description} - Consultant planning and oversight phase`,
                    budget: phaseBudget,
                    progress,
                    status,
                    startDate: new Date(Date.now() - Math.random() * 100 * 24 * 60 * 60 * 1000).toISOString(),
                    endDate: new Date(Date.now() + Math.random() * 200 * 24 * 60 * 60 * 1000).toISOString(),
                    dueDate: new Date(Date.now() + Math.random() * 150 * 24 * 60 * 60 * 1000).toISOString(),
                };
                try {
                    const phase = await this.projectPhaseService.createPhase(project.id, createPhaseDto, consultant.id);
                    allPhases.push(phase);
                    await this.seedSubPhasesForPhase(phase.id, status, 'legacy');
                }
                catch (error) {
                    console.error(`   ⚠️  Error creating consultant phase: ${error.message}`);
                }
            }
        }
        console.log(`   ✓ Created ${allPhases.length} consultant phases (contractors will be assigned and create their phases later)`);
        return allPhases;
    }
    async seedSubPhasesForPhase(phaseId, phaseStatus, phaseType) {
        const subPhaseTemplates = {
            "Mipango na Uchunguzi": [
                {
                    title: "Ukaguzi wa mazingira na utafiti",
                    description: "Kufanya utafiti wa kina wa mazingira",
                },
                {
                    title: "Kupanga muundo na michoro",
                    description: "Kutengeneza michoro na muundo wa mradi",
                },
                {
                    title: "Kupata vibali na idhini",
                    description: "Kupata vibali vya ujenzi kutoka serikali",
                },
                {
                    title: "Kupanga bajeti na muda",
                    description: "Kupanga bajeti ya kina na ratiba ya muda",
                },
            ],
            "Ubunifu na Miundo": [
                {
                    title: "Kubuni muundo wa kiufundi",
                    description: "Kutengeneza muundo wa kiufundi na kiteknolojia",
                },
                {
                    title: "Kupanga mifumo ya umeme",
                    description: "Kupanga na kubuni mifumo ya umeme",
                },
                {
                    title: "Kupanga mifumo ya maji",
                    description: "Kubuni mifumo ya maji na maji taka",
                },
                {
                    title: "Kukagua na kuthibitisha muundo",
                    description: "Kufanya ukaguzi na uthibitishaji wa muundo",
                },
            ],
            "Utayarishaji wa Mazingira": [
                {
                    title: "Kusafisha eneo la ujenzi",
                    description: "Kusafisha na kuondoa vitu visivyohitajika",
                },
                {
                    title: "Kukata miti na kuondoa mimea",
                    description: "Kukata miti na kuondoa mimea inayozuia",
                },
                {
                    title: "Kusawazisha ardhi",
                    description: "Kusawazisha na kuandaa ardhi kwa ujenzi",
                },
                {
                    title: "Kuweka alama za mipaka",
                    description: "Kuweka alama za mipaka na eneo la ujenzi",
                },
            ],
            "Ujenzi wa Msingi": [
                {
                    title: "Kuchimba shimo la msingi",
                    description: "Kuchimba shimo la kina cha msingi",
                },
                {
                    title: "Kuweka chuma cha msingi",
                    description: "Kuweka chuma cha kuimarisha msingi",
                },
                {
                    title: "Kumwaga saruji ya msingi",
                    description: "Kumwaga saruji na kukausha msingi",
                },
                {
                    title: "Kujenga miundombinu ya maji",
                    description: "Kuweka mifumo ya maji na maji taka",
                },
            ],
            "Ujenzi wa Maumbo": [
                {
                    title: "Kujenga kuta za mbao",
                    description: "Kujenga kuta za mbao za muundo",
                },
                { title: "Kuweka paa", description: "Kuweka paa na kufunika muundo" },
                {
                    title: "Kuweka milango na madirisha",
                    description: "Kuweka milango na madirisha",
                },
                {
                    title: "Kujenga ngazi na sakafu",
                    description: "Kujenga ngazi na sakafu za ndani",
                },
            ],
            "Umalishaji na Upimaji": [
                {
                    title: "Kumaliza ujenzi wa ndani",
                    description: "Kumaliza kazi zote za ndani",
                },
                {
                    title: "Kupima ubora wa ujenzi",
                    description: "Kufanya upimaji wa ubora na usalama",
                },
                {
                    title: "Kuweka alama za usalama",
                    description: "Kuweka alama na maelekezo ya usalama",
                },
                {
                    title: "Kukabidhi mradi",
                    description: "Kukabidhi mradi kwa mteja baada ya kumaliza",
                },
            ],
        };
        let phaseTitle = '';
        let phaseDescription = '';
        let phaseProgress = 0;
        if (phaseType === 'contractor') {
            const contractorPhase = await this.contractorPhaseRepository.findOne({
                where: { id: phaseId },
            });
            if (contractorPhase) {
                phaseTitle = contractorPhase.title || '';
                phaseDescription = contractorPhase.description || '';
                phaseProgress = contractorPhase.progress || 0;
            }
        }
        else if (phaseType === 'sub_contractor') {
            const subContractorPhase = await this.subContractorPhaseRepository.findOne({
                where: { id: phaseId },
            });
            if (subContractorPhase) {
                phaseTitle = subContractorPhase.title || '';
                phaseDescription = subContractorPhase.description || '';
                phaseProgress = subContractorPhase.progress || 0;
            }
        }
        else {
            const legacyPhase = await this.phaseRepository.findOne({
                where: { id: phaseId },
            });
            if (legacyPhase) {
                phaseTitle = legacyPhase.title || '';
                phaseDescription = legacyPhase.description || '';
                phaseProgress = legacyPhase.progress || 0;
            }
        }
        let subPhasesToCreate = [];
        for (const [key, templates] of Object.entries(subPhaseTemplates)) {
            if (phaseTitle.includes(key) || phaseDescription?.includes(key)) {
                subPhasesToCreate = templates;
                break;
            }
        }
        if (subPhasesToCreate.length === 0) {
            subPhasesToCreate = [
                {
                    title: "Hatua ya kwanza",
                    description: "Kuanza na hatua ya kwanza ya mradi",
                },
                { title: "Hatua ya pili", description: "Kuendelea na hatua ya pili" },
                { title: "Hatua ya tatu", description: "Kumaliza hatua ya tatu" },
                {
                    title: "Kumaliza na kukagua",
                    description: "Kumaliza na kufanya ukaguzi wa mwisho",
                },
            ];
        }
        let completedCount = 0;
        if (phaseStatus === phase_entity_1.PhaseStatus.COMPLETED) {
            completedCount = subPhasesToCreate.length;
        }
        else if (phaseStatus === phase_entity_1.PhaseStatus.IN_PROGRESS) {
            const progressRatio = phaseProgress / 100;
            completedCount = Math.floor(subPhasesToCreate.length * progressRatio);
        }
        const users = await this.userRepository.find({ where: { status: "active" } });
        const contractors = users.filter(u => u.role === user_entity_1.UserRole.CONTRACTOR);
        const subContractors = users.filter(u => u.role === user_entity_1.UserRole.SUB_CONTRACTOR);
        const consultants = users.filter(u => u.role === user_entity_1.UserRole.CONSULTANT);
        let user;
        if (phaseType === 'contractor' && contractors.length > 0) {
            user = contractors[Math.floor(Math.random() * contractors.length)];
        }
        else if (phaseType === 'sub_contractor' && subContractors.length > 0) {
            user = subContractors[Math.floor(Math.random() * subContractors.length)];
        }
        else if (consultants.length > 0) {
            user = consultants[Math.floor(Math.random() * consultants.length)];
        }
        else {
            user = users[0];
        }
        for (let i = 0; i < subPhasesToCreate.length; i++) {
            const template = subPhasesToCreate[i];
            const isCompleted = i < completedCount;
            try {
                await this.subPhasesService.create(phaseId, {
                    title: template.title,
                    description: template.description,
                    isCompleted,
                }, user);
            }
            catch (error) {
                console.error(`   ⚠️  Error creating sub-phase "${template.title}": ${error.message}`);
            }
        }
    }
    async seedTasks(projects, phases, users) {
        const taskTemplates = [
            { description: "Ukaguzi wa mazingira", unit: "siku", price: 500000 },
            { description: "Uongozi wa timu", unit: "wiki", price: 2000000 },
            { description: "Ununuzi wa vifaa", unit: "vipimo", price: 10000000 },
            {
                description: "Ujenzi wa misingi",
                unit: "meta za mraba",
                price: 150000,
            },
            { description: "Usakinishaji wa umeme", unit: "pointi", price: 250000 },
            { description: "Uchoraji wa maji", unit: "meta", price: 100000 },
            { description: "Upakaji wa rangi", unit: "meta za mraba", price: 25000 },
            { description: "Ufungaji wa milango", unit: "kipimo", price: 800000 },
        ];
        const tasks = [];
        for (const phase of phases) {
            const numTasks = 2 + Math.floor(Math.random() * 4);
            for (let i = 0; i < numTasks; i++) {
                const template = taskTemplates[Math.floor(Math.random() * taskTemplates.length)];
                const quantity = 1 + Math.random() * 100;
                const projectId = phase.project_id || phase.project?.id || null;
                if (!projectId) {
                    console.error(`   ⚠️  Phase ${phase.id} has no project_id, skipping task creation`);
                    continue;
                }
                const task = this.taskRepository.create({
                    description: `${template.description} - ${phase.title}`,
                    unit: template.unit,
                    quantity: Math.round(quantity * 100) / 100,
                    price: template.price,
                    project_id: projectId,
                    phase_id: phase.id,
                });
                await this.taskRepository.save(task);
                tasks.push(task);
            }
        }
        return tasks;
    }
    async seedFinancialData(projects, users) {
        const globalUsedTransactionNumbers = new Set();
        for (const project of projects) {
            const categories = [
                { name: "Vifaa na Malighafi", budgetPercentage: 0.35, description: "Ununuzi wa vifaa vya ujenzi, saruji, chuma, na malighafi zingine" },
                { name: "Ajira na Mishahara", budgetPercentage: 0.25, description: "Mishahara ya wafanyakazi, mafundi, na wataalamu" },
                { name: "Usafirishaji na Logistiki", budgetPercentage: 0.15, description: "Gharama za usafirishaji wa vifaa na watu" },
                { name: "Matibabu na Bima", budgetPercentage: 0.08, description: "Bima ya afya na dhamana kwa wafanyakazi" },
                { name: "Uongozi wa Mradi", budgetPercentage: 0.07, description: "Gharama za usimamizi na uongozi wa mradi" },
                { name: "Mafunzo na Ujuzi", budgetPercentage: 0.05, description: "Mafunzo ya wafanyakazi na uboreshaji wa ujuzi" },
                { name: "Mazingira na Usafi", budgetPercentage: 0.05, description: "Gharama za utunzaji wa mazingira na usafi" },
            ];
            const createdCategories = [];
            for (const categoryData of categories) {
                const financialSummary = await this.financialSummaryRepository.findOne({
                    where: { project_id: project.id },
                });
                const projectBudget = financialSummary?.totalBudget || project.totalAmount || 0;
                const budgetedAmount = projectBudget * categoryData.budgetPercentage;
                const category = this.budgetCategoryRepository.create({
                    projectId: project.id,
                    name: categoryData.name,
                    description: categoryData.description || `Bajeti ya ${categoryData.name} kwa ${project.title}`,
                    budgetedAmount,
                    spentAmount: 0,
                    isActive: true,
                    createdBy: users[0].id,
                });
                await this.budgetCategoryRepository.save(category);
                createdCategories.push(category);
                await this.createTransactionsForCategory(category, users, globalUsedTransactionNumbers);
            }
            await this.createGeneralProjectTransactions(project, users, globalUsedTransactionNumbers);
            for (const category of createdCategories) {
                await this.recalculateCategorySpentAmount(category.id);
            }
            await this.recalculateProjectSpentAmount(project.id);
            const totalAllocated = createdCategories.reduce((sum, cat) => {
                const amount = typeof cat.budgetedAmount === 'number'
                    ? cat.budgetedAmount
                    : parseFloat(String(cat.budgetedAmount || 0)) || 0;
                return sum + amount;
            }, 0);
            const normalizedAllocated = Math.max(0, Math.min(totalAllocated, 9999999999999.99));
            const financialSummary = await this.financialSummaryRepository.findOne({
                where: { project_id: project.id },
            });
            if (financialSummary) {
                financialSummary.allocatedBudget = normalizedAllocated;
                await this.financialSummaryRepository.save(financialSummary);
            }
            await this.createSavingsRecords(project, users[0]);
            await this.createBudgetAlerts(project);
        }
    }
    async recalculateCategorySpentAmount(categoryId) {
        const transactions = await this.transactionRepository.find({
            where: { categoryId },
        });
        const { sumAmounts, extractTransactionAmount } = await Promise.resolve().then(() => require('../utils/amount.utils'));
        const totalSpent = transactions.reduce((sum, t) => {
            return sum + extractTransactionAmount(t);
        }, 0);
        const normalizedSpent = Math.max(0, totalSpent);
        await this.budgetCategoryRepository.update(categoryId, {
            spentAmount: normalizedSpent,
        });
    }
    async recalculateProjectSpentAmount(projectId) {
        const transactions = await this.transactionRepository.find({
            where: { projectId },
        });
        const { extractTransactionAmount } = await Promise.resolve().then(() => require('../utils/amount.utils'));
        const validTransactions = transactions.filter(t => {
            if (t.projectId !== projectId) {
                return false;
            }
            return true;
        });
        const totalSpent = validTransactions.reduce((sum, t) => {
            return sum + extractTransactionAmount(t);
        }, 0);
        const normalizedSpent = Math.max(0, totalSpent);
        const financialSummary = await this.financialSummaryRepository.findOne({
            where: { project_id: projectId },
        });
        if (financialSummary) {
            financialSummary.spentAmount = normalizedSpent;
            await this.financialSummaryRepository.save(financialSummary);
        }
    }
    async createGeneralProjectTransactions(project, users, globalUsedNumbers) {
        const transactionCount = Math.floor(Math.random() * 6) + 3;
        const tanzanianVendors = [
            "NMB Bank Tanzania",
            "CRDB Bank",
            "Precision Air",
            "Vodacom Tanzania",
            "TANESCO",
            "Tanzania Portland Cement",
            "Kilimanjaro Steel",
            "Mbeya Cement",
            "Simba Cement",
            "Azam Group Tanzania",
            "Tanzania Revenue Authority",
            "Tanzania Bureau of Standards",
        ];
        for (let i = 0; i < transactionCount; i++) {
            const amount = Math.random() * 5000000 + 500000;
            const now = new Date();
            const daysAgo = Math.floor(Math.random() * 90);
            const transactionDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
            let transactionNumber;
            let attempts = 0;
            do {
                const timestamp = Date.now();
                const random = Math.floor(Math.random() * 1000000);
                const uniqueId = `${timestamp}${random}${i}`;
                transactionNumber = `TXN${transactionDate.getFullYear()}${(transactionDate.getMonth() + 1).toString().padStart(2, "0")}${transactionDate.getDate().toString().padStart(2, "0")}${uniqueId.slice(-12)}`;
                attempts++;
                if (attempts > 100) {
                    transactionNumber = `TXN${transactionDate.getFullYear()}${(transactionDate.getMonth() + 1).toString().padStart(2, "0")}${transactionDate.getDate().toString().padStart(2, "0")}${Math.random().toString(36).substring(2, 15).toUpperCase()}${i}`;
                    break;
                }
            } while (globalUsedNumbers.has(transactionNumber));
            globalUsedNumbers.add(transactionNumber);
            let transactionType = project_transaction_entity_1.TransactionType.EXPENSE;
            if (Math.random() < 0.1) {
                transactionType = project_transaction_entity_1.TransactionType.REFUND;
            }
            else if (Math.random() < 0.15) {
                transactionType = project_transaction_entity_1.TransactionType.ADJUSTMENT;
            }
            const transaction = this.transactionRepository.create({
                projectId: project.id,
                categoryId: null,
                transactionNumber,
                amount,
                type: transactionType,
                description: this.getRandomTransactionDescription("General"),
                vendor: tanzanianVendors[Math.floor(Math.random() * tanzanianVendors.length)],
                transactionDate,
                approvalStatus: Math.random() < 0.8 ? project_transaction_entity_1.ApprovalStatus.APPROVED : project_transaction_entity_1.ApprovalStatus.PENDING,
                approvedBy: transactionType === project_transaction_entity_1.TransactionType.EXPENSE && Math.random() < 0.8
                    ? users[Math.floor(Math.random() * users.length)].id
                    : null,
                approvedAt: transactionType === project_transaction_entity_1.TransactionType.EXPENSE && Math.random() < 0.8
                    ? transactionDate
                    : null,
                createdBy: users[Math.floor(Math.random() * users.length)].id,
            });
            await this.transactionRepository.save(transaction);
        }
    }
    async createTransactionsForCategory(category, users, globalUsedNumbers) {
        const transactionCount = Math.floor(Math.random() * 11) + 5;
        const targetSpent = category.budgetedAmount * (0.4 + Math.random() * 0.5);
        let totalSpent = 0;
        const tanzanianVendors = [
            "NMB Bank Tanzania",
            "CRDB Bank",
            "Precision Air",
            "Vodacom Tanzania",
            "TANESCO",
            "Tanzania Portland Cement",
            "Kilimanjaro Steel",
            "Mbeya Cement",
            "Simba Cement",
            "Azam Group Tanzania",
            "Tanzania Revenue Authority",
            "Tanzania Bureau of Standards",
            "Tanzania Electric Supply Company",
            "Tanzania Railways Corporation",
            "Air Tanzania",
        ];
        const now = new Date();
        const projectStartDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        for (let i = 0; i < transactionCount; i++) {
            const remainingAmount = targetSpent - totalSpent;
            const maxAmount = i === transactionCount - 1
                ? remainingAmount
                : remainingAmount / (transactionCount - i);
            const amount = Math.min(maxAmount, Math.random() * maxAmount + 100000);
            const daysAgo = Math.floor(Math.random() * 180);
            const transactionDate = new Date(projectStartDate.getTime() + daysAgo * 24 * 60 * 60 * 1000);
            let transactionNumber;
            let attempts = 0;
            do {
                const timestamp = Date.now();
                const random = Math.floor(Math.random() * 1000000);
                const uniqueId = `${timestamp}${random}${i}${category.id.slice(0, 4)}`;
                transactionNumber = `TXN${transactionDate.getFullYear()}${(transactionDate.getMonth() + 1).toString().padStart(2, "0")}${transactionDate.getDate().toString().padStart(2, "0")}${uniqueId.slice(-12)}`;
                attempts++;
                if (attempts > 100) {
                    transactionNumber = `TXN${transactionDate.getFullYear()}${(transactionDate.getMonth() + 1).toString().padStart(2, "0")}${transactionDate.getDate().toString().padStart(2, "0")}${Math.random().toString(36).substring(2, 15).toUpperCase()}${i}`;
                    break;
                }
            } while (globalUsedNumbers.has(transactionNumber));
            globalUsedNumbers.add(transactionNumber);
            let transactionType = project_transaction_entity_1.TransactionType.EXPENSE;
            if (Math.random() < 0.08) {
                transactionType = project_transaction_entity_1.TransactionType.REFUND;
            }
            else if (Math.random() < 0.12) {
                transactionType = project_transaction_entity_1.TransactionType.ADJUSTMENT;
            }
            const isApproved = Math.random() < 0.85;
            const approvalStatus = isApproved ? project_transaction_entity_1.ApprovalStatus.APPROVED :
                Math.random() < 0.5 ? project_transaction_entity_1.ApprovalStatus.PENDING : project_transaction_entity_1.ApprovalStatus.REJECTED;
            const transaction = this.transactionRepository.create({
                projectId: category.projectId,
                categoryId: category.id,
                transactionNumber,
                amount,
                type: transactionType,
                description: this.getRandomTransactionDescription(category.name),
                vendor: tanzanianVendors[Math.floor(Math.random() * tanzanianVendors.length)],
                transactionDate,
                approvalStatus,
                approvedBy: isApproved && transactionType === project_transaction_entity_1.TransactionType.EXPENSE
                    ? users[Math.floor(Math.random() * users.length)].id
                    : null,
                approvedAt: isApproved && transactionType === project_transaction_entity_1.TransactionType.EXPENSE
                    ? transactionDate
                    : null,
                createdBy: users[Math.floor(Math.random() * users.length)].id,
            });
            await this.transactionRepository.save(transaction);
            totalSpent += amount;
            await new Promise((resolve) => setTimeout(resolve, 5));
        }
    }
    async createSavingsRecords(project, user) {
        const financialSummary = await this.financialSummaryRepository.findOne({
            where: { project_id: project.id },
        });
        if (!financialSummary || financialSummary.estimatedSavings <= 0)
            return;
        const savingsCategories = [
            "Punguzo la Bei kwa Ununuzi wa Kwingi",
            "Malipo ya Mapema",
            "Mazungumzo ya Bei",
            "Uboreshaji wa Michakato",
            "Ugawaji Bora wa Rasilimali",
        ];
        for (let i = 0; i < Math.min(3, savingsCategories.length); i++) {
            const category = savingsCategories[i];
            const budgetedAmount = Math.random() * 5000000 + 1000000;
            const actualAmount = budgetedAmount * (0.7 + Math.random() * 0.2);
            const savings = this.savingsRepository.create({
                projectId: project.id,
                category,
                budgetedAmount,
                actualAmount,
                reason: this.getSavingsReason(category),
                description: `Akiba iliyopatikana kupitia ${category.toLowerCase()}`,
                achievedDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
                verificationStatus: project_savings_entity_1.VerificationStatus.VERIFIED,
                verifiedBy: user.id,
                createdBy: user.id,
            });
            await this.savingsRepository.save(savings);
        }
    }
    async createBudgetAlerts(project) {
        const financialSummary = await this.financialSummaryRepository.findOne({
            where: { project_id: project.id },
        });
        if (!financialSummary)
            return;
        const totalBudget = typeof financialSummary.totalBudget === 'number'
            ? financialSummary.totalBudget
            : parseFloat(String(financialSummary.totalBudget || 0)) || 0;
        const spentAmount = typeof financialSummary.spentAmount === 'number'
            ? financialSummary.spentAmount
            : parseFloat(String(financialSummary.spentAmount || 0)) || 0;
        let utilizationPercentage = 0;
        if (totalBudget > 0) {
            utilizationPercentage = (spentAmount / totalBudget) * 100;
        }
        utilizationPercentage = Math.min(Math.max(utilizationPercentage, 0), 999.99);
        utilizationPercentage = Math.round(utilizationPercentage * 100) / 100;
        if (utilizationPercentage >= 95) {
            const alert = this.alertRepository.create({
                projectId: project.id,
                alertType: budget_alert_entity_1.AlertType.CRITICAL,
                thresholdPercentage: 95,
                currentPercentage: utilizationPercentage,
                emailRecipients: ["finance.manager@kipimo.co.tz", "admin@kipimo.co.tz"],
                isActive: true,
            });
            await this.alertRepository.save(alert);
        }
        else if (utilizationPercentage >= 85) {
            const alert = this.alertRepository.create({
                projectId: project.id,
                alertType: budget_alert_entity_1.AlertType.WARNING,
                thresholdPercentage: 85,
                currentPercentage: utilizationPercentage,
                emailRecipients: ["finance.manager@kipimo.co.tz"],
                isActive: true,
            });
            await this.alertRepository.save(alert);
        }
    }
    async seedActivities(users, projects, tasks) {
        const activityTemplates = [
            {
                type: activity_entity_1.ActivityType.PROJECT_CREATED,
                description: "Mradi mpya umeundwa",
            },
            {
                type: activity_entity_1.ActivityType.PROJECT_UPDATED,
                description: "Taarifa za mradi zimesasishwa",
            },
            { type: activity_entity_1.ActivityType.TASK_CREATED, description: "Kazi mpya imeongezwa" },
            { type: activity_entity_1.ActivityType.TASK_COMPLETED, description: "Kazi imekamilishwa" },
            {
                type: activity_entity_1.ActivityType.PHASE_COMPLETED,
                description: "Awamu imekamilishwa",
            },
            {
                type: activity_entity_1.ActivityType.COLLABORATOR_ADDED,
                description: "Mshirika ameongezwa kwenye mradi",
            },
            {
                type: activity_entity_1.ActivityType.BOQ_UPLOADED,
                description: "Orodha ya vifaa imepakiwa",
            },
            { type: activity_entity_1.ActivityType.COMMENT_ADDED, description: "Maoni yameongezwa" },
        ];
        const activities = [];
        for (let i = 0; i < 75; i++) {
            const template = activityTemplates[Math.floor(Math.random() * activityTemplates.length)];
            const user = users[Math.floor(Math.random() * users.filter((u) => u.status === "active").length)];
            const project = projects[Math.floor(Math.random() * projects.length)];
            const task = Math.random() > 0.5
                ? tasks[Math.floor(Math.random() * tasks.length)]
                : null;
            const activity = this.activityRepository.create({
                type: template.type,
                description: `${template.description} na ${user.display_name}`,
                metadata: JSON.stringify({
                    projectTitle: project.title,
                    userRole: user.role,
                    timestamp: new Date().toISOString(),
                }),
                user_id: user.id,
                project_id: project.id,
                task_id: task?.id || null,
                created_at: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
            });
            await this.activityRepository.save(activity);
            activities.push(activity);
        }
        return activities;
    }
    async seedReports(users) {
        const reportData = [
            {
                name: "Ripoti ya Fedha - Mwezi wa 12",
                description: "Ripoti ya jumla ya matumizi ya fedha mwezi wa Desemba",
                type: report_entity_1.ReportType.XLSX,
                status: report_entity_1.ReportStatus.READY,
                fileName: "ripoti_fedha_desemba_2024.xlsx",
                fileSize: 2048576,
            },
            {
                name: "Takwimu za Miradi - Q4 2024",
                description: "Muhtasari wa maendeleo ya miradi robo ya nne 2024",
                type: report_entity_1.ReportType.PDF,
                status: report_entity_1.ReportStatus.READY,
                fileName: "takwimu_miradi_q4_2024.pdf",
                fileSize: 5242880,
            },
            {
                name: "Jedwali la Shughuli - Januari",
                description: "Jedwali la shughuli zote za mwezi wa Januari",
                type: report_entity_1.ReportType.CSV,
                status: report_entity_1.ReportStatus.PROCESSING,
                fileName: null,
                fileSize: null,
                progress: 65,
            },
            {
                name: "Ripoti ya Wafanyakazi",
                description: "Takwimu za wafanyakazi na utendaji wao",
                type: report_entity_1.ReportType.JSON,
                status: report_entity_1.ReportStatus.FAILED,
                fileName: null,
                fileSize: null,
                error: "Hitilafu ya mfumo wa hifadhidata",
            },
        ];
        for (const data of reportData) {
            const report = this.reportRepository.create({
                name: data.name,
                description: data.description,
                type: data.type,
                status: data.status,
                fileName: data.fileName,
                fileMimeType: data.fileName ? this.getMimeType(data.type) : null,
                fileSize: data.fileSize,
                error: data.error || null,
                progress: data.progress || (data.status === report_entity_1.ReportStatus.READY ? 100 : 0),
                generated_by: users[Math.floor(Math.random() * users.length)].id,
                dateFrom: new Date(2024, 0, 1),
                dateTo: new Date(2024, 11, 31),
                retentionDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            });
            await this.reportRepository.save(report);
        }
    }
    async seedComments(users, projects, tasks) {
        const commentTexts = [
            "Mradi huu unakwenda vizuri. Hongera kwa timu!",
            "Tunahitaji kuongeza haraka katika awamu hii.",
            "Bei ya vifaa imepanda. Tunahitaji kuongoza mazungumzo.",
            "Ubora wa kazi ni mzuri sana. Endelezeni.",
            "Kuna changamoto za muda. Tunahitaji msaada zaidi.",
            "Ripoti ya maendeleo imesasishwa. Tafadhali angalieni.",
            "Tunahitaji mkutano wa haraka kuongea juu ya bajeti.",
            "Mazingira ya hali ya hewa yanahitaji uzingatiaji zaidi.",
        ];
        for (let i = 0; i < 40; i++) {
            const user = users[Math.floor(Math.random() * users.filter((u) => u.status === "active").length)];
            const project = projects[Math.floor(Math.random() * projects.length)];
            const task = Math.random() > 0.6
                ? tasks[Math.floor(Math.random() * tasks.length)]
                : null;
            const commentText = commentTexts[Math.floor(Math.random() * commentTexts.length)];
            const comment = this.commentRepository.create({
                content: commentText,
                author_id: user.id,
                project_id: project.id,
                task_id: task?.id || null,
                created_at: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
            });
            await this.commentRepository.save(comment);
        }
    }
    async seedComplaints(users, projects, phases) {
        const complaintTitles = [
            "Ubora wa vifaa haukufikia viwango",
            "Ucheleweshaji wa utoaji wa vifaa",
            "Matatizo ya usafiri wa wafanyakazi",
            "Kukosekana kwa vifaa vya usalama",
            "Matatizo ya mfumo wa maji",
            "Uharibifu wa vifaa vya ujenzi",
            "Kukosekana kwa mafunzo ya usalama",
            "Matatizo ya mfumo wa umeme",
            "Ucheleweshaji wa malipo",
            "Ubora wa kazi haukufikia viwango",
        ];
        const complaintDescriptions = [
            "Vifaa vilivyotumika havifanani na viwango vilivyoainishwa katika mkataba. Tunaomba ufuatiliaji wa haraka.",
            "Utoaji wa vifaa umechelewa kwa zaidi ya wiki mbili, na hii inaathiri maendeleo ya mradi.",
            "Wafanyakazi wanakabiliwa na matatizo ya usafiri kutoka makao yao hadi tovuti ya ujenzi.",
            "Vifaa muhimu vya usalama havipo kwenye tovuti, na hii inaweza kuhatarisha usalama wa wafanyakazi.",
            "Mfumo wa maji una matatizo ya kudumu ambayo yanaathiri maendeleo ya kazi.",
            "Vifaa vingi vya ujenzi vimeharibika na haviwezi kutumika tena.",
            "Wafanyakazi hawajapata mafunzo ya usalama yanayohitajika kwa kazi hii.",
            "Mfumo wa umeme una matatizo ya mara kwa mara ambayo yanaathiri utendaji wa vifaa.",
            "Malipo ya wafanyakazi yamechelewa kwa zaidi ya mwezi mmoja.",
            "Ubora wa kazi uliofanywa haukufikia viwango vilivyoainishwa katika mkataba.",
        ];
        const responseTexts = [
            "Tumekubali malalamiko yako na tutachukua hatua za haraka. Tunaendelea na uchunguzi wa kina.",
            "Tumefuatilia suala hili na tumepanga mkutano na wadau ili kutatua tatizo hili haraka iwezekanavyo.",
            "Tumekubali malalamiko yako. Tunaendelea na uboreshaji wa mchakato ili kuepuka matatizo kama haya baadaye.",
            "Tumefuatilia suala hili na tumepanga mafunzo ya ziada ya usalama kwa wafanyakazi wote.",
            "Tumekubali malalamiko yako na tutachukua hatua za haraka ili kutatua tatizo hili.",
        ];
        const appealReasons = [
            "Jibu la malalamiko halikutosheleza na hatujapata ufumbuzi wa tatizo.",
            "Tunaamini kwamba jibu la malalamiko halikufuatilia kwa kina suala hili.",
            "Tatizo bado lipo na hatujapata ufumbuzi unaofaa.",
        ];
        const activeUsers = users.filter((u) => u.status === "active");
        const activeProjects = projects.filter((p) => p.status !== project_entity_1.ProjectStatus.CANCELLED);
        const phaseIds = phases.map((p) => p.id);
        const allSubPhases = phaseIds.length > 0
            ? await this.subPhaseRepository
                .createQueryBuilder("subPhase")
                .where("subPhase.phase_id IN (:...phaseIds)", { phaseIds })
                .getMany()
            : [];
        for (let i = 0; i < 25; i++) {
            const project = activeProjects[Math.floor(Math.random() * activeProjects.length)];
            const projectPhases = phases.filter((p) => p.project_id === project.id);
            const phase = projectPhases.length > 0 && Math.random() > 0.3
                ? projectPhases[Math.floor(Math.random() * projectPhases.length)]
                : null;
            const subPhase = phase && allSubPhases.length > 0 && Math.random() > 0.5
                ? allSubPhases.find((sp) => sp.phase_id === phase.id) || null
                : null;
            const raiser = activeUsers[Math.floor(Math.random() * activeUsers.length)];
            const title = complaintTitles[Math.floor(Math.random() * complaintTitles.length)];
            const description = complaintDescriptions[Math.floor(Math.random() * complaintDescriptions.length)];
            let status = complaint_entity_1.ComplaintStatus.OPEN;
            let response = null;
            let respondedBy = null;
            let respondedAt = null;
            let appealReason = null;
            let appealedAt = null;
            const statusRoll = Math.random();
            if (statusRoll > 0.4) {
                if (statusRoll > 0.9) {
                    status = complaint_entity_1.ComplaintStatus.APPEALED;
                    appealReason =
                        appealReasons[Math.floor(Math.random() * appealReasons.length)];
                    appealedAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
                    response =
                        responseTexts[Math.floor(Math.random() * responseTexts.length)];
                    const responder = activeUsers[Math.floor(Math.random() * activeUsers.length)];
                    respondedBy = responder.id;
                    respondedAt = new Date(appealedAt.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
                }
                else {
                    status = complaint_entity_1.ComplaintStatus.RESOLVED;
                    response =
                        responseTexts[Math.floor(Math.random() * responseTexts.length)];
                    const responder = activeUsers[Math.floor(Math.random() * activeUsers.length)];
                    respondedBy = responder.id;
                    respondedAt = new Date(Date.now() - Math.random() * 45 * 24 * 60 * 60 * 1000);
                }
            }
            const complaint = this.complaintRepository.create({
                project_id: project.id,
                phase_id: phase?.id || null,
                sub_phase_id: subPhase?.id || null,
                raised_by: raiser.id,
                title,
                description,
                status,
                response,
                responded_by: respondedBy,
                responded_at: respondedAt,
                appeal_reason: appealReason,
                appealed_at: appealedAt,
                created_at: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
            });
            await this.complaintRepository.save(complaint);
        }
    }
    getRandomTransactionDescription(categoryName) {
        const descriptions = {
            "Vifaa na Malighafi": [
                "Ununuzi wa simiti",
                "Malighafi ya ujenzi",
                "Vifaa vya umeme",
                "Madini ya ujenzi",
            ],
            "Ajira na Mishahara": [
                "Mishahara ya mwezi",
                "Malipo ya ziada",
                "Ada za mafunzo",
                "Bima ya wafanyakazi",
            ],
            "Usafirishaji na Logistiki": [
                "Nauli za usafirishaji",
                "Mafuta ya magari",
                "Huduma za logistiki",
                "Kodi za barabara",
            ],
            "Matibabu na Bima": [
                "Bima ya mradi",
                "Huduma za matibabu",
                "Vifaa vya usalama",
                "Matibabu ya dharura",
            ],
            "Uongozi wa Mradi": [
                "Ada za ushauri",
                "Mikutano ya mradi",
                "Huduma za uongozi",
                "Ripoti za mradi",
            ],
        };
        const categoryDescriptions = descriptions[categoryName] || [
            "Gharama ya jumla",
            "Malipo ya huduma",
            "Gharama ya vifaa",
            "Malipo ya kazi",
        ];
        return categoryDescriptions[Math.floor(Math.random() * categoryDescriptions.length)];
    }
    getSavingsReason(category) {
        const reasons = {
            "Punguzo la Bei kwa Ununuzi wa Kwingi": "Punguzo la bei kwa ununuzi wa wingi mkubwa",
            "Malipo ya Mapema": "Punguzo kwa malipo ya haraka ndani ya siku 10",
            "Mazungumzo ya Bei": "Mazungumzo ya mafanikio ya kupunguza bei",
            "Uboreshaji wa Michakato": "Uboreshaji wa ufanisi uliopunguza gharama",
            "Ugawaji Bora wa Rasilimali": "Matumizi mazuri ya rasilimali yaliyopunguza gharama",
        };
        return (reasons[category] || "Uongozi mzuri wa gharama kupitia mipango ya kisera");
    }
    getMimeType(reportType) {
        switch (reportType) {
            case report_entity_1.ReportType.PDF:
                return "application/pdf";
            case report_entity_1.ReportType.XLSX:
                return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            case report_entity_1.ReportType.CSV:
                return "text/csv";
            case report_entity_1.ReportType.JSON:
                return "application/json";
            default:
                return "application/octet-stream";
        }
    }
    async seedInventoryItems(users, projects) {
        const inventoryItems = [
            {
                name: "Cement (Portland)",
                description: "High quality Portland cement for construction",
                unit: "bag",
                unit_price: 12000,
                category: inventory_entity_1.InventoryCategory.MATERIALS,
                brand: "Tembo",
                supplier: "Tanzania Portland Cement Company",
                supplier_contact: "+255 22 213 4567",
                quantity_available: 250,
                minimum_stock: 50,
                sku: "MAT-CEM-001",
                is_active: true,
            },
            {
                name: "Steel Reinforcement Bars (12mm)",
                description: "Grade 60 steel reinforcement bars for concrete structures",
                unit: "ton",
                unit_price: 1200000,
                category: inventory_entity_1.InventoryCategory.MATERIALS,
                brand: "Acero",
                supplier: "Tanzania Steel Works",
                supplier_contact: "+255 22 234 5678",
                quantity_available: 15,
                minimum_stock: 5,
                sku: "MAT-STL-012",
                is_active: true,
            },
            {
                name: "River Sand",
                description: "Fine river sand for concrete and plastering",
                unit: "truck",
                unit_price: 350000,
                category: inventory_entity_1.InventoryCategory.MATERIALS,
                supplier: "Dar es Salaam Sand Suppliers",
                supplier_contact: "+255 754 123 456",
                quantity_available: 8,
                minimum_stock: 3,
                sku: "MAT-SND-001",
                is_active: true,
            },
            {
                name: "Coarse Aggregate (20mm)",
                description: "Crushed stone aggregate for concrete",
                unit: "truck",
                unit_price: 380000,
                category: inventory_entity_1.InventoryCategory.MATERIALS,
                supplier: "Tanzania Quarry Products",
                supplier_contact: "+255 755 234 567",
                quantity_available: 12,
                minimum_stock: 4,
                sku: "MAT-AGG-020",
                is_active: true,
            },
            {
                name: "Bricks (Standard)",
                description: "Standard fired clay bricks for masonry",
                unit: "piece",
                unit_price: 150,
                category: inventory_entity_1.InventoryCategory.MATERIALS,
                supplier: "Kilimanjaro Brick Works",
                supplier_contact: "+255 27 275 1234",
                quantity_available: 5000,
                minimum_stock: 1000,
                sku: "MAT-BRK-001",
                is_active: true,
            },
            {
                name: "PVC Pipes (4 inch)",
                description: "PVC water pipes for plumbing",
                unit: "meter",
                unit_price: 8500,
                category: inventory_entity_1.InventoryCategory.MATERIALS,
                brand: "AquaFlow",
                supplier: "Tanzania Plumbing Supplies",
                supplier_contact: "+255 22 245 6789",
                quantity_available: 200,
                minimum_stock: 50,
                sku: "MAT-PVC-004",
                is_active: true,
            },
            {
                name: "Electrical Wire (2.5mm²)",
                description: "Copper electrical wire for wiring",
                unit: "meter",
                unit_price: 2500,
                category: inventory_entity_1.InventoryCategory.MATERIALS,
                brand: "PowerLine",
                supplier: "Tanzania Electrical Supplies",
                supplier_contact: "+255 22 256 7890",
                quantity_available: 500,
                minimum_stock: 100,
                sku: "MAT-WIR-0025",
                is_active: true,
            },
            {
                name: "Roofing Sheets (Corrugated Iron)",
                description: "Galvanized corrugated iron roofing sheets",
                unit: "sheet",
                unit_price: 45000,
                category: inventory_entity_1.InventoryCategory.MATERIALS,
                brand: "SteelRoof",
                supplier: "Tanzania Roofing Solutions",
                supplier_contact: "+255 756 345 678",
                quantity_available: 80,
                minimum_stock: 20,
                sku: "MAT-RF-001",
                is_active: true,
            },
            {
                name: "Paint (White Emulsion)",
                description: "Water-based white emulsion paint for interior walls",
                unit: "liter",
                unit_price: 8500,
                category: inventory_entity_1.InventoryCategory.MATERIALS,
                brand: "Crown Paints",
                supplier: "Tanzania Paint Distributors",
                supplier_contact: "+255 22 267 8901",
                quantity_available: 120,
                minimum_stock: 30,
                sku: "MAT-PNT-WHT",
                is_active: true,
            },
            {
                name: "Tiles (Ceramic 30x30cm)",
                description: "Ceramic floor tiles",
                unit: "piece",
                unit_price: 3500,
                category: inventory_entity_1.InventoryCategory.MATERIALS,
                brand: "TileMaster",
                supplier: "Tanzania Tile Importers",
                supplier_contact: "+255 757 456 789",
                quantity_available: 300,
                minimum_stock: 100,
                sku: "MAT-TIL-3030",
                is_active: true,
            },
            {
                name: "Excavator (CAT 320)",
                description: "Heavy-duty excavator for earthworks",
                unit: "hour",
                unit_price: 150000,
                category: inventory_entity_1.InventoryCategory.EQUIPMENT,
                brand: "Caterpillar",
                model: "CAT 320",
                supplier: "Tanzania Heavy Machinery",
                supplier_contact: "+255 22 278 9012",
                quantity_available: 2,
                minimum_stock: 1,
                sku: "EQP-EXC-320",
                is_active: true,
            },
            {
                name: "Concrete Mixer (500L)",
                description: "Portable concrete mixer",
                unit: "hour",
                unit_price: 25000,
                category: inventory_entity_1.InventoryCategory.EQUIPMENT,
                brand: "MixMaster",
                model: "MM-500",
                supplier: "Tanzania Construction Equipment",
                supplier_contact: "+255 758 567 890",
                quantity_available: 5,
                minimum_stock: 2,
                sku: "EQP-MIX-500",
                is_active: true,
            },
            {
                name: "Generator (50KVA)",
                description: "Diesel generator for site power",
                unit: "hour",
                unit_price: 35000,
                category: inventory_entity_1.InventoryCategory.EQUIPMENT,
                brand: "PowerGen",
                model: "PG-50KVA",
                supplier: "Tanzania Power Solutions",
                supplier_contact: "+255 22 289 0123",
                quantity_available: 3,
                minimum_stock: 1,
                sku: "EQP-GEN-50",
                is_active: true,
            },
            {
                name: "Compressor (Air)",
                description: "Air compressor for pneumatic tools",
                unit: "hour",
                unit_price: 15000,
                category: inventory_entity_1.InventoryCategory.EQUIPMENT,
                brand: "AirTech",
                model: "AT-200",
                supplier: "Tanzania Tools & Equipment",
                supplier_contact: "+255 759 678 901",
                quantity_available: 4,
                minimum_stock: 2,
                sku: "EQP-COM-200",
                is_active: true,
            },
            {
                name: "Hammer Drill",
                description: "Electric hammer drill for masonry",
                unit: "piece",
                unit_price: 180000,
                category: inventory_entity_1.InventoryCategory.TOOLS,
                brand: "Bosch",
                model: "GBH 2-26",
                supplier: "Tanzania Tool Distributors",
                supplier_contact: "+255 22 290 1234",
                quantity_available: 8,
                minimum_stock: 3,
                sku: "TOL-HDR-001",
                is_active: true,
            },
            {
                name: "Circular Saw",
                description: "Electric circular saw for cutting wood",
                unit: "piece",
                unit_price: 250000,
                category: inventory_entity_1.InventoryCategory.TOOLS,
                brand: "Makita",
                model: "5007MG",
                supplier: "Tanzania Tool Distributors",
                supplier_contact: "+255 22 290 1234",
                quantity_available: 6,
                minimum_stock: 2,
                sku: "TOL-CSAW-001",
                is_active: true,
            },
            {
                name: "Measuring Tape (50m)",
                description: "Steel measuring tape",
                unit: "piece",
                unit_price: 45000,
                category: inventory_entity_1.InventoryCategory.TOOLS,
                brand: "Stanley",
                supplier: "Tanzania Tool Distributors",
                supplier_contact: "+255 22 290 1234",
                quantity_available: 15,
                minimum_stock: 5,
                sku: "TOL-TAPE-50",
                is_active: true,
            },
            {
                name: "Level (Spirit)",
                description: "Spirit level for checking horizontal/vertical",
                unit: "piece",
                unit_price: 35000,
                category: inventory_entity_1.InventoryCategory.TOOLS,
                brand: "Stabila",
                supplier: "Tanzania Tool Distributors",
                supplier_contact: "+255 22 290 1234",
                quantity_available: 12,
                minimum_stock: 4,
                sku: "TOL-LVL-001",
                is_active: true,
            },
            {
                name: "Safety Helmets",
                description: "Construction safety helmets",
                unit: "piece",
                unit_price: 25000,
                category: inventory_entity_1.InventoryCategory.EQUIPMENT,
                brand: "SafetyFirst",
                supplier: "Tanzania Safety Equipment",
                supplier_contact: "+255 22 356 7890",
                quantity_available: 8,
                minimum_stock: 15,
                sku: "EQP-HELM-001",
                is_active: true,
            },
            {
                name: "Safety Boots",
                description: "Steel-toed safety boots",
                unit: "pair",
                unit_price: 45000,
                category: inventory_entity_1.InventoryCategory.EQUIPMENT,
                brand: "WorkSafe",
                supplier: "Tanzania Safety Equipment",
                supplier_contact: "+255 22 356 7890",
                quantity_available: 5,
                minimum_stock: 12,
                sku: "EQP-BOOT-001",
                is_active: true,
            },
            {
                name: "Welding Rods",
                description: "Steel welding rods",
                unit: "kg",
                unit_price: 8500,
                category: inventory_entity_1.InventoryCategory.MATERIALS,
                brand: "WeldPro",
                supplier: "Tanzania Welding Supplies",
                supplier_contact: "+255 22 367 8901",
                quantity_available: 12,
                minimum_stock: 25,
                sku: "MAT-WELD-001",
                is_active: true,
            },
        ];
        const createdItems = [];
        const financeUsers = users.filter((u) => u.role === user_entity_1.UserRole.FINANCE || u.role === user_entity_1.UserRole.CONSULTANT);
        const randomUser = financeUsers[Math.floor(Math.random() * financeUsers.length)] || users[0];
        for (const itemData of inventoryItems) {
            let supplierId = null;
            if (itemData.supplier) {
                let supplier = await this.supplierRepository.findOne({
                    where: { name: itemData.supplier },
                });
                if (!supplier) {
                    supplier = this.supplierRepository.create({
                        name: itemData.supplier,
                        contact_person: itemData.supplier_contact || null,
                        phone: itemData.supplier_contact || null,
                    });
                    supplier = await this.supplierRepository.save(supplier);
                }
                supplierId = supplier.id;
            }
            const { supplier, supplier_contact, ...inventoryData } = itemData;
            const inventory = this.inventoryRepository.create({
                ...inventoryData,
                supplierId,
                created_by: randomUser.id,
                picture_url: `https://via.placeholder.com/400x300?text=${encodeURIComponent(itemData.name)}`,
                tags: itemData.category ? [itemData.category.toString()] : [],
            });
            const saved = await this.inventoryRepository.save(inventory);
            createdItems.push(saved);
        }
        return createdItems;
    }
    async seedUserPreferences(users) {
        console.log("\n📋 Seeding User Preferences...");
        for (const user of users) {
            const existing = await this.userPreferencesRepository.findOne({
                where: { user_id: user.id },
            });
            if (!existing) {
                const preferences = this.userPreferencesRepository.create({
                    user_id: user.id,
                    notification_preferences: {
                        email: true,
                        project_updates: true,
                        task_updates: true,
                        financial_updates: user.role === user_entity_1.UserRole.FINANCE || user.role === user_entity_1.UserRole.CONSULTANT,
                        inventory_alerts: user.role === user_entity_1.UserRole.FINANCE || user.role === user_entity_1.UserRole.CONSULTANT,
                        system_notifications: true,
                    },
                    language: "en",
                    timezone: "Africa/Dar_es_Salaam",
                    theme: "dark",
                    items_per_page: 10,
                    email_notifications_enabled: true,
                    push_notifications_enabled: true,
                });
                await this.userPreferencesRepository.save(preferences);
            }
        }
        console.log(`   ✓ Created user preferences for ${users.length} users`);
    }
    async seedUserSessions(users) {
        console.log("\n🔐 Seeding User Sessions...");
        const activeUsers = users.filter((u) => u.status === "active").slice(0, 10);
        let sessionCount = 0;
        for (const user of activeUsers) {
            const numSessions = Math.floor(Math.random() * 3) + 1;
            for (let i = 0; i < numSessions; i++) {
                const session = this.userSessionRepository.create({
                    userId: user.id,
                    token: crypto.randomBytes(32).toString("hex"),
                    ip_address: `192.168.1.${Math.floor(Math.random() * 255)}`,
                    user_agent: i % 2 === 0 ? "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" : "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)",
                    device_type: i % 2 === 0 ? "desktop" : "mobile",
                    browser: i % 2 === 0 ? "Chrome" : "Safari",
                    os: i % 2 === 0 ? "Windows" : "iOS",
                    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    is_active: Math.random() > 0.3,
                    last_activity: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
                    location: "Dar es Salaam, Tanzania",
                });
                await this.userSessionRepository.save(session);
                sessionCount++;
            }
        }
        console.log(`   ✓ Created ${sessionCount} user sessions`);
    }
    async seedProjectMetadata(projects) {
        console.log("\n📄 Seeding Project Metadata...");
        const tanzanianLocations = [
            "Dar es Salaam",
            "Dodoma",
            "Mwanza",
            "Arusha",
            "Mbeya",
            "Tanga",
            "Morogoro",
            "Zanzibar",
            "Kigoma",
            "Iringa",
        ];
        const clientNames = [
            "Tanzania Government",
            "Dar es Salaam City Council",
            "TANESCO",
            "Tanzania Ports Authority",
            "Tanzania Railways Corporation",
            "Ministry of Health",
            "Ministry of Education",
            "Tanzania National Roads Agency",
        ];
        for (const project of projects) {
            const existing = await this.projectMetadataRepository.findOne({
                where: { project_id: project.id },
            });
            if (!existing) {
                const location = tanzanianLocations[Math.floor(Math.random() * tanzanianLocations.length)];
                const clientName = clientNames[Math.floor(Math.random() * clientNames.length)];
                const metadata = this.projectMetadataRepository.create({
                    project_id: project.id,
                    location: location,
                    address: `${location}, Tanzania`,
                    coordinates: JSON.stringify({
                        lat: -6.7924 + (Math.random() * 2 - 1) * 0.5,
                        lng: 39.2083 + (Math.random() * 2 - 1) * 0.5,
                    }),
                    client_name: clientName,
                    client_contact: `+255 ${700 + Math.floor(Math.random() * 100)} ${Math.floor(Math.random() * 1000000).toString().padStart(6, "0")}`,
                    client_email: `contact@${clientName.toLowerCase().replace(/\s+/g, "")}.co.tz`,
                    architect: `Arch. ${["John", "Mary", "Peter", "Sarah"][Math.floor(Math.random() * 4)]} ${["Mwangi", "Kimani", "Ochieng", "Njoroge"][Math.floor(Math.random() * 4)]}`,
                    engineer: `Eng. ${["Hassan", "Fatma", "Amina", "Juma"][Math.floor(Math.random() * 4)]} ${["Kikwete", "Mohammed", "Bakari", "Juma"][Math.floor(Math.random() * 4)]}`,
                    contractor_name: "Tanzania Construction Company Ltd",
                    contract_number: `CONTRACT-${project.id.slice(0, 8).toUpperCase()}`,
                    contract_date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
                    permit_number: `PERMIT-${Math.floor(Math.random() * 100000)}`,
                    permit_issued_date: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000),
                    notes: `Project metadata for ${project.title}`,
                });
                await this.projectMetadataRepository.save(metadata);
            }
        }
        console.log(`   ✓ Created metadata for ${projects.length} projects`);
    }
    async seedProjectSettings(projects) {
        console.log("\n⚙️ Seeding Project Settings...");
        for (const project of projects) {
            const existing = await this.projectSettingsRepository.findOne({
                where: { project_id: project.id },
            });
            if (!existing) {
                const settings = this.projectSettingsRepository.create({
                    project_id: project.id,
                    allow_collaborator_invites: true,
                    allow_task_creation: true,
                    allow_phase_modification: true,
                    require_approval_for_transactions: Math.random() > 0.5,
                    approval_threshold: 1000000,
                    send_notifications: true,
                    track_inventory: true,
                    track_time: true,
                    currency: "TZS",
                    language: "en",
                    custom_settings: {
                        timezone: "Africa/Dar_es_Salaam",
                        date_format: "DD/MM/YYYY",
                    },
                });
                await this.projectSettingsRepository.save(settings);
            }
        }
        console.log(`   ✓ Created settings for ${projects.length} projects`);
    }
    async seedPhaseFinancialSummaries(phases) {
        console.log("\n💰 Seeding Phase Financial Summaries...");
        for (const phase of phases) {
            const existing = await this.phaseFinancialSummaryRepository.findOne({
                where: { phase_id: phase.id },
            });
            if (!existing) {
                const budget = phase.budget || 0;
                const spent = budget * (0.3 + Math.random() * 0.5);
                const estimated = budget * (0.9 + Math.random() * 0.1);
                const actual = spent * (0.95 + Math.random() * 0.1);
                const variance = actual - estimated;
                let financialStatus = "on_track";
                if (variance > budget * 0.1) {
                    financialStatus = "over_budget";
                }
                else if (variance > budget * 0.05) {
                    financialStatus = "warning";
                }
                const summary = this.phaseFinancialSummaryRepository.create({
                    phase_id: phase.id,
                    allocatedBudget: budget,
                    spentAmount: spent,
                    estimatedCost: estimated,
                    actualCost: actual,
                    variance,
                    financialStatus,
                    lastUpdated: new Date(),
                });
                await this.phaseFinancialSummaryRepository.save(summary);
            }
        }
        console.log(`   ✓ Created financial summaries for ${phases.length} phases`);
    }
    async seedTransactionAttachments(projects) {
        console.log("\n📎 Seeding Transaction Attachments...");
        let attachmentCount = 0;
        for (const project of projects) {
            const transactions = await this.transactionRepository.find({
                where: { projectId: project.id },
                take: 10,
            });
            for (const transaction of transactions.slice(0, Math.floor(transactions.length * 0.6))) {
                const numAttachments = Math.floor(Math.random() * 3) + 1;
                for (let i = 0; i < numAttachments; i++) {
                    const attachment = this.transactionAttachmentRepository.create({
                        transactionId: transaction.id,
                        type: i === 0 ? transaction_attachment_entity_1.AttachmentType.RECEIPT :
                            i === 1 ? transaction_attachment_entity_1.AttachmentType.INVOICE :
                                transaction_attachment_entity_1.AttachmentType.OTHER,
                        file_url: `https://storage.example.com/transactions/${transaction.id}/attachment-${i + 1}.pdf`,
                        file_name: `${transaction.transactionNumber}-${i === 0 ? "receipt" : i === 1 ? "invoice" : "document"}-${i + 1}.pdf`,
                        file_mime_type: "application/pdf",
                        file_size: 100000 + Math.floor(Math.random() * 500000),
                        description: i === 0 ? "Payment receipt" : i === 1 ? "Invoice document" : "Supporting document",
                        uploadedBy: transaction.createdBy || transaction.approvedBy || "",
                    });
                    await this.transactionAttachmentRepository.save(attachment);
                    attachmentCount++;
                }
            }
        }
        console.log(`   ✓ Created ${attachmentCount} transaction attachments`);
    }
    async seedTransactionApprovalHistory(projects) {
        console.log("\n✅ Seeding Transaction Approval History...");
        let historyCount = 0;
        for (const project of projects) {
            const transactions = await this.transactionRepository.find({
                where: { projectId: project.id, approvalStatus: project_transaction_entity_1.ApprovalStatus.APPROVED },
                take: 15,
            });
            for (const transaction of transactions) {
                if (transaction.approvedBy && transaction.approvedAt) {
                    const history = this.transactionApprovalHistoryRepository.create({
                        transactionId: transaction.id,
                        action: transaction_approval_history_entity_1.ApprovalAction.APPROVED,
                        actionBy: transaction.approvedBy,
                        comment: "Transaction approved as per budget guidelines",
                        reason: "Within budget allocation",
                    });
                    await this.transactionApprovalHistoryRepository.save(history);
                    historyCount++;
                }
            }
        }
        console.log(`   ✓ Created ${historyCount} approval history records`);
    }
    async seedAuditLogs(users, projects) {
        console.log("\n📊 Seeding Audit Logs...");
        const auditActions = [
            { action: audit_log_entity_1.AuditAction.CREATE, entity: audit_log_entity_1.AuditEntityType.PROJECT },
            { action: audit_log_entity_1.AuditAction.UPDATE, entity: audit_log_entity_1.AuditEntityType.PROJECT },
            { action: audit_log_entity_1.AuditAction.VIEW, entity: audit_log_entity_1.AuditEntityType.PROJECT },
            { action: audit_log_entity_1.AuditAction.CREATE, entity: audit_log_entity_1.AuditEntityType.TRANSACTION },
            { action: audit_log_entity_1.AuditAction.APPROVE, entity: audit_log_entity_1.AuditEntityType.TRANSACTION },
            { action: audit_log_entity_1.AuditAction.CREATE, entity: audit_log_entity_1.AuditEntityType.INVENTORY },
            { action: audit_log_entity_1.AuditAction.UPDATE, entity: audit_log_entity_1.AuditEntityType.INVENTORY },
            { action: audit_log_entity_1.AuditAction.LOGIN, entity: audit_log_entity_1.AuditEntityType.USER },
            { action: audit_log_entity_1.AuditAction.EXPORT, entity: audit_log_entity_1.AuditEntityType.REPORT },
        ];
        let logCount = 0;
        for (let i = 0; i < 100; i++) {
            const user = users[Math.floor(Math.random() * users.length)];
            const auditTemplate = auditActions[Math.floor(Math.random() * auditActions.length)];
            const project = projects[Math.floor(Math.random() * projects.length)];
            const log = this.auditLogRepository.create({
                action: auditTemplate.action,
                entity_type: auditTemplate.entity,
                entity_id: auditTemplate.entity === audit_log_entity_1.AuditEntityType.PROJECT ? project.id :
                    auditTemplate.entity === audit_log_entity_1.AuditEntityType.USER ? user.id :
                        crypto.randomUUID(),
                userId: user.id,
                description: `${auditTemplate.action} ${auditTemplate.entity} by ${user.display_name}`,
                old_values: auditTemplate.action === audit_log_entity_1.AuditAction.UPDATE ? { status: "old" } : null,
                new_values: auditTemplate.action === audit_log_entity_1.AuditAction.UPDATE ? { status: "new" } : null,
                ip_address: `192.168.1.${Math.floor(Math.random() * 255)}`,
                user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                is_successful: Math.random() > 0.1,
                error_message: Math.random() > 0.9 ? "Sample error message" : null,
            });
            await this.auditLogRepository.save(log);
            logCount++;
        }
        console.log(`   ✓ Created ${logCount} audit log entries`);
    }
    async seedInventoryUsageLogs(users, projects, phases) {
        console.log("\n📦 Seeding Inventory Usage Logs...");
        const inventoryItems = await this.inventoryRepository.find({ take: 20 });
        let logCount = 0;
        for (let i = 0; i < 50; i++) {
            const inventory = inventoryItems[Math.floor(Math.random() * inventoryItems.length)];
            const project = projects[Math.floor(Math.random() * projects.length)];
            const projectPhases = phases.filter((p) => p.project_id === project.id);
            const phase = projectPhases.length > 0 ? projectPhases[Math.floor(Math.random() * projectPhases.length)] : null;
            const user = users[Math.floor(Math.random() * users.length)];
            const usageTypes = [inventory_usage_log_entity_1.UsageType.USED, inventory_usage_log_entity_1.UsageType.USED, inventory_usage_log_entity_1.UsageType.USED, inventory_usage_log_entity_1.UsageType.RETURNED, inventory_usage_log_entity_1.UsageType.DAMAGED];
            const usageType = usageTypes[Math.floor(Math.random() * usageTypes.length)];
            const quantity = Math.floor(Math.random() * 10) + 1;
            const unitPrice = inventory.unit_price || 0;
            const totalCost = quantity * unitPrice;
            const log = this.inventoryUsageLogRepository.create({
                inventoryId: inventory.id,
                projectId: project.id,
                phaseId: phase?.id || null,
                usage_type: usageType,
                quantity,
                unit_price: unitPrice,
                total_cost: totalCost,
                notes: `${usageType} ${quantity} ${inventory.unit} of ${inventory.name} for ${project.title}`,
                recordedBy: user.id,
                usage_date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
            });
            await this.inventoryUsageLogRepository.save(log);
            logCount++;
        }
        console.log(`   ✓ Created ${logCount} inventory usage log entries`);
    }
    async seedBOQData(projects, users) {
        console.log("\n📋 Seeding BOQ Data and BOQ Phases...");
        const contractors = users.filter(u => u.role === user_entity_1.UserRole.CONTRACTOR && u.status === "active");
        const subContractors = users.filter(u => u.role === user_entity_1.UserRole.SUB_CONTRACTOR && u.status === "active");
        const consultants = users.filter(u => u.role === user_entity_1.UserRole.CONSULTANT && u.status === "active");
        const boqItemTemplates = [
            { section: "Earthworks", description: "Excavation for foundation", unit: "m³", rate: 15000, quantity: 100 },
            { section: "Earthworks", description: "Backfilling and compaction", unit: "m³", rate: 12000, quantity: 80 },
            { section: "Earthworks", description: "Site clearing and preparation", unit: "m²", rate: 5000, quantity: 500 },
            { section: "Concrete Works", description: "Reinforced concrete for foundation", unit: "m³", rate: 250000, quantity: 50 },
            { section: "Concrete Works", description: "Concrete for columns", unit: "m³", rate: 280000, quantity: 30 },
            { section: "Concrete Works", description: "Concrete for beams", unit: "m³", rate: 270000, quantity: 25 },
            { section: "Concrete Works", description: "Concrete for slabs", unit: "m³", rate: 260000, quantity: 40 },
            { section: "Masonry", description: "Brickwork for walls", unit: "m²", rate: 45000, quantity: 200 },
            { section: "Masonry", description: "Blockwork for partitions", unit: "m²", rate: 40000, quantity: 150 },
            { section: "Masonry", description: "Stone masonry", unit: "m²", rate: 60000, quantity: 100 },
            { section: "Steel Works", description: "Reinforcement steel bars", unit: "kg", rate: 2500, quantity: 5000 },
            { section: "Steel Works", description: "Structural steel fabrication", unit: "kg", rate: 3500, quantity: 3000 },
            { section: "Steel Works", description: "Steel installation", unit: "kg", rate: 2000, quantity: 8000 },
            { section: "Roofing", description: "Roof trusses", unit: "m²", rate: 35000, quantity: 300 },
            { section: "Roofing", description: "Roofing sheets", unit: "m²", rate: 25000, quantity: 350 },
            { section: "Roofing", description: "Gutters and downpipes", unit: "m", rate: 15000, quantity: 200 },
            { section: "Finishes", description: "Plastering", unit: "m²", rate: 12000, quantity: 800 },
            { section: "Finishes", description: "Painting", unit: "m²", rate: 8000, quantity: 900 },
            { section: "Finishes", description: "Floor tiling", unit: "m²", rate: 30000, quantity: 400 },
            { section: "Finishes", description: "Wall tiling", unit: "m²", rate: 35000, quantity: 200 },
            { section: "Electrical", description: "Electrical wiring", unit: "m", rate: 5000, quantity: 1000 },
            { section: "Electrical", description: "Light fixtures", unit: "no", rate: 50000, quantity: 50 },
            { section: "Electrical", description: "Switchboards", unit: "no", rate: 200000, quantity: 5 },
            { section: "Plumbing", description: "Water supply pipes", unit: "m", rate: 8000, quantity: 500 },
            { section: "Plumbing", description: "Drainage pipes", unit: "m", rate: 10000, quantity: 400 },
            { section: "Plumbing", description: "Sanitary fixtures", unit: "no", rate: 150000, quantity: 20 },
            { section: "Doors and Windows", description: "Doors", unit: "no", rate: 200000, quantity: 30 },
            { section: "Doors and Windows", description: "Windows", unit: "no", rate: 150000, quantity: 40 },
            { section: "Doors and Windows", description: "Door frames", unit: "no", rate: 80000, quantity: 30 },
            { section: "Site Works", description: "Fencing", unit: "m", rate: 25000, quantity: 200 },
            { section: "Site Works", description: "Landscaping", unit: "m²", rate: 15000, quantity: 500 },
            { section: "Site Works", description: "Road works", unit: "m²", rate: 45000, quantity: 300 },
        ];
        let boqCount = 0;
        let boqPhaseCount = 0;
        const projectsToSeed = projects.slice(0, Math.floor(projects.length * 0.7));
        for (const project of projectsToSeed) {
            const financialSummary = await this.financialSummaryRepository.findOne({
                where: { project_id: project.id },
            });
            const projectBudget = financialSummary?.totalBudget || project.totalAmount || 100000000;
            const hasContractorBOQ = Math.random() > 0.3;
            const hasSubContractorBOQ = Math.random() > 0.4;
            const uploader = consultants[Math.floor(Math.random() * consultants.length)] || users[0];
            if (hasContractorBOQ) {
                const contractorBoqItems = [];
                const numItems = 8 + Math.floor(Math.random() * 12);
                let totalAmount = 0;
                for (let i = 0; i < numItems; i++) {
                    const template = boqItemTemplates[Math.floor(Math.random() * boqItemTemplates.length)];
                    const quantity = template.quantity * (0.8 + Math.random() * 0.4);
                    const rate = template.rate * (0.9 + Math.random() * 0.2);
                    const amount = quantity * rate;
                    totalAmount += amount;
                    contractorBoqItems.push({
                        description: template.description,
                        section: template.section,
                        unit: template.unit,
                        quantity: Math.round(quantity * 100) / 100,
                        rate: Math.round(rate * 100) / 100,
                        amount: Math.round(amount * 100) / 100,
                        rowIndex: i + 1,
                        rawData: {},
                    });
                }
                const contractorBoq = this.projectBoqRepository.create({
                    project_id: project.id,
                    type: project_boq_entity_1.BOQType.CONTRACTOR,
                    status: project_boq_entity_1.BOQStatus.PROCESSED,
                    file_name: `BOQ_Contractor_${project.title.replace(/\s+/g, '_')}.xlsx`,
                    file_path: `/uploads/boq/${project.id}/contractor_boq.xlsx`,
                    file_mimetype: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    file_size: 50000 + Math.floor(Math.random() * 100000),
                    total_amount: totalAmount,
                    phases_count: contractorBoqItems.length,
                    uploaded_by: uploader.id,
                });
                const savedContractorBoq = await this.projectBoqRepository.save(contractorBoq);
                boqCount++;
                for (const item of contractorBoqItems) {
                    const phaseStartDate = new Date(Date.now() - Math.random() * 100 * 24 * 60 * 60 * 1000);
                    const phaseEndDate = new Date(phaseStartDate.getTime() + (30 + Math.random() * 90) * 24 * 60 * 60 * 1000);
                    const boqPhase = this.phaseRepository.create({
                        title: item.description,
                        description: `Section: ${item.section} | Unit: ${item.unit} | Quantity: ${item.quantity} | Rate: ${item.rate.toLocaleString('en-US')} TZS`,
                        budget: item.amount,
                        start_date: phaseStartDate,
                        end_date: phaseEndDate,
                        due_date: phaseEndDate,
                        progress: 0,
                        status: phase_entity_1.PhaseStatus.NOT_STARTED,
                        project_id: project.id,
                        is_active: false,
                        from_boq: true,
                        boqType: "contractor",
                        created_at: new Date(),
                        updated_at: new Date(),
                    });
                    await this.phaseRepository.save(boqPhase);
                    boqPhaseCount++;
                }
            }
            if (hasSubContractorBOQ) {
                const subContractorBoqItems = [];
                const numItems = 5 + Math.floor(Math.random() * 10);
                let totalAmount = 0;
                for (let i = 0; i < numItems; i++) {
                    const template = boqItemTemplates[Math.floor(Math.random() * boqItemTemplates.length)];
                    const quantity = template.quantity * (0.5 + Math.random() * 0.3);
                    const rate = template.rate * (0.8 + Math.random() * 0.2);
                    const amount = quantity * rate;
                    totalAmount += amount;
                    subContractorBoqItems.push({
                        description: `${template.description} (Sub-Contractor)`,
                        section: template.section,
                        unit: template.unit,
                        quantity: Math.round(quantity * 100) / 100,
                        rate: Math.round(rate * 100) / 100,
                        amount: Math.round(amount * 100) / 100,
                        rowIndex: i + 1,
                        rawData: {},
                    });
                }
                const subContractorBoq = this.projectBoqRepository.create({
                    project_id: project.id,
                    type: project_boq_entity_1.BOQType.SUB_CONTRACTOR,
                    status: project_boq_entity_1.BOQStatus.PROCESSED,
                    file_name: `BOQ_SubContractor_${project.title.replace(/\s+/g, '_')}.xlsx`,
                    file_path: `/uploads/boq/${project.id}/sub_contractor_boq.xlsx`,
                    file_mimetype: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    file_size: 40000 + Math.floor(Math.random() * 80000),
                    total_amount: totalAmount,
                    phases_count: subContractorBoqItems.length,
                    uploaded_by: uploader.id,
                });
                const savedSubContractorBoq = await this.projectBoqRepository.save(subContractorBoq);
                boqCount++;
                const contractorPhases = await this.contractorPhaseRepository.find({
                    where: { project_id: project.id },
                    take: 5,
                });
                for (const item of subContractorBoqItems) {
                    const phaseStartDate = new Date(Date.now() - Math.random() * 80 * 24 * 60 * 60 * 1000);
                    const phaseEndDate = new Date(phaseStartDate.getTime() + (20 + Math.random() * 60) * 24 * 60 * 60 * 1000);
                    const linkedContractorPhaseId = contractorPhases.length > 0 && Math.random() > 0.5
                        ? contractorPhases[Math.floor(Math.random() * contractorPhases.length)].id
                        : null;
                    const boqPhase = this.phaseRepository.create({
                        title: item.description,
                        description: `Section: ${item.section} | Unit: ${item.unit} | Quantity: ${item.quantity} | Rate: ${item.rate.toLocaleString('en-US')} TZS`,
                        budget: item.amount,
                        start_date: phaseStartDate,
                        end_date: phaseEndDate,
                        due_date: phaseEndDate,
                        progress: 0,
                        status: phase_entity_1.PhaseStatus.NOT_STARTED,
                        project_id: project.id,
                        is_active: false,
                        from_boq: true,
                        boqType: "sub_contractor",
                        linkedContractorPhaseId: linkedContractorPhaseId,
                        created_at: new Date(),
                        updated_at: new Date(),
                    });
                    await this.phaseRepository.save(boqPhase);
                    boqPhaseCount++;
                }
            }
        }
        console.log(`   ✓ Created ${boqCount} BOQ entries`);
        console.log(`   ✓ Created ${boqPhaseCount} phases from BOQ data (visible in "View BOQ Phases" area)`);
    }
};
exports.SeedService = SeedService;
exports.SeedService = SeedService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(department_entity_1.Department)),
    __param(2, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __param(3, (0, typeorm_1.InjectRepository)(phase_entity_1.Phase)),
    __param(4, (0, typeorm_1.InjectRepository)(contractor_phase_entity_1.ContractorPhase)),
    __param(5, (0, typeorm_1.InjectRepository)(sub_contractor_phase_entity_1.SubContractorPhase)),
    __param(6, (0, typeorm_1.InjectRepository)(task_entity_1.Task)),
    __param(7, (0, typeorm_1.InjectRepository)(budget_category_entity_1.BudgetCategory)),
    __param(8, (0, typeorm_1.InjectRepository)(project_transaction_entity_1.ProjectTransaction)),
    __param(9, (0, typeorm_1.InjectRepository)(project_savings_entity_1.ProjectSavings)),
    __param(10, (0, typeorm_1.InjectRepository)(budget_alert_entity_1.BudgetAlert)),
    __param(11, (0, typeorm_1.InjectRepository)(admin_entity_1.Admin)),
    __param(12, (0, typeorm_1.InjectRepository)(activity_entity_1.Activity)),
    __param(13, (0, typeorm_1.InjectRepository)(report_entity_1.Report)),
    __param(14, (0, typeorm_1.InjectRepository)(comment_entity_1.Comment)),
    __param(15, (0, typeorm_1.InjectRepository)(complaint_entity_1.Complaint)),
    __param(16, (0, typeorm_1.InjectRepository)(sub_phase_entity_1.SubPhase)),
    __param(17, (0, typeorm_1.InjectRepository)(inventory_entity_1.Inventory)),
    __param(18, (0, typeorm_1.InjectRepository)(project_financial_summary_entity_1.ProjectFinancialSummary)),
    __param(19, (0, typeorm_1.InjectRepository)(supplier_entity_1.Supplier)),
    __param(20, (0, typeorm_1.InjectRepository)(project_metadata_entity_1.ProjectMetadata)),
    __param(21, (0, typeorm_1.InjectRepository)(project_settings_entity_1.ProjectSettings)),
    __param(22, (0, typeorm_1.InjectRepository)(phase_financial_summary_entity_1.PhaseFinancialSummary)),
    __param(23, (0, typeorm_1.InjectRepository)(user_preferences_entity_1.UserPreferences)),
    __param(24, (0, typeorm_1.InjectRepository)(user_session_entity_1.UserSession)),
    __param(25, (0, typeorm_1.InjectRepository)(transaction_attachment_entity_1.TransactionAttachment)),
    __param(26, (0, typeorm_1.InjectRepository)(transaction_approval_history_entity_1.TransactionApprovalHistory)),
    __param(27, (0, typeorm_1.InjectRepository)(audit_log_entity_1.AuditLog)),
    __param(28, (0, typeorm_1.InjectRepository)(inventory_usage_log_entity_1.InventoryUsageLog)),
    __param(29, (0, typeorm_1.InjectRepository)(project_boq_entity_1.ProjectBoq)),
    __param(30, (0, common_1.Inject)((0, common_1.forwardRef)(() => projects_service_1.ProjectsService))),
    __param(31, (0, common_1.Inject)((0, common_1.forwardRef)(() => project_phase_service_1.ProjectPhaseService))),
    __param(32, (0, common_1.Inject)((0, common_1.forwardRef)(() => subphases_service_1.SubPhasesService))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        projects_service_1.ProjectsService,
        project_phase_service_1.ProjectPhaseService,
        subphases_service_1.SubPhasesService])
], SeedService);
let SeedCommand = class SeedCommand {
    constructor(seedService) {
        this.seedService = seedService;
    }
    async run() {
        await this.seedService.seed();
    }
};
exports.SeedCommand = SeedCommand;
__decorate([
    (0, nestjs_command_1.Command)({
        command: "seed",
        describe: "seed the database with comprehensive Tanzanian admin dashboard data",
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SeedCommand.prototype, "run", null);
exports.SeedCommand = SeedCommand = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [SeedService])
], SeedCommand);
//# sourceMappingURL=seed.command.js.map