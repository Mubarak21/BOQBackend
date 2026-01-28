import { Command } from "nestjs-command";
import { Injectable, forwardRef, Inject } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User, UserRole } from "../entities/user.entity";
import { Department } from "../entities/department.entity";
import {
  Project,
  ProjectStatus,
  ProjectPriority,
} from "../entities/project.entity";
import { Phase, PhaseStatus } from "../entities/phase.entity";
import { ContractorPhase } from "../entities/contractor-phase.entity";
import { SubContractorPhase } from "../entities/sub-contractor-phase.entity";
import { Task } from "../entities/task.entity";
import { BudgetCategory } from "../finance/entities/budget-category.entity";
import {
  ProjectTransaction,
  TransactionType,
  ApprovalStatus,
} from "../finance/entities/project-transaction.entity";
import {
  ProjectSavings,
  VerificationStatus,
} from "../finance/entities/project-savings.entity";
import {
  BudgetAlert,
  AlertType,
} from "../finance/entities/budget-alert.entity";
import { Admin } from "../entities/admin.entity";
import { Activity, ActivityType } from "../entities/activity.entity";
import { Report, ReportStatus, ReportType } from "../entities/report.entity";
import { Comment } from "../entities/comment.entity";
import { Complaint, ComplaintStatus } from "../entities/complaint.entity";
import { SubPhase } from "../entities/sub-phase.entity";
import { Inventory, InventoryCategory } from "../entities/inventory.entity";
import { ProjectFinancialSummary } from "../entities/project-financial-summary.entity";
import { Supplier } from "../entities/supplier.entity";
import { ProjectMetadata } from "../entities/project-metadata.entity";
import { ProjectSettings } from "../entities/project-settings.entity";
import { PhaseFinancialSummary } from "../entities/phase-financial-summary.entity";
import { UserPreferences } from "../entities/user-preferences.entity";
import { UserSession } from "../entities/user-session.entity";
import { TransactionAttachment, AttachmentType } from "../entities/transaction-attachment.entity";
import { TransactionApprovalHistory, ApprovalAction } from "../entities/transaction-approval-history.entity";
import { AuditLog, AuditAction, AuditEntityType } from "../entities/audit-log.entity";
import { InventoryUsageLog, UsageType } from "../entities/inventory-usage-log.entity";
import { ProjectBoq, BOQType, BOQStatus } from "../entities/project-boq.entity";
import { ProjectsService } from "../projects/projects.service";
import { ProjectPhaseService } from "../projects/services/project-phase.service";
import { SubPhasesService } from "../projects/subphases.service";
import { CreateProjectDto } from "../projects/dto/create-project.dto";
import { CreatePhaseDto } from "../projects/dto/create-phase.dto";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Phase)
    private readonly phaseRepository: Repository<Phase>,
    @InjectRepository(ContractorPhase)
    private readonly contractorPhaseRepository: Repository<ContractorPhase>,
    @InjectRepository(SubContractorPhase)
    private readonly subContractorPhaseRepository: Repository<SubContractorPhase>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(BudgetCategory)
    private readonly budgetCategoryRepository: Repository<BudgetCategory>,
    @InjectRepository(ProjectTransaction)
    private readonly transactionRepository: Repository<ProjectTransaction>,
    @InjectRepository(ProjectSavings)
    private readonly savingsRepository: Repository<ProjectSavings>,
    @InjectRepository(BudgetAlert)
    private readonly alertRepository: Repository<BudgetAlert>,
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(Complaint)
    private readonly complaintRepository: Repository<Complaint>,
    @InjectRepository(SubPhase)
    private readonly subPhaseRepository: Repository<SubPhase>,
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    @InjectRepository(ProjectFinancialSummary)
    private readonly financialSummaryRepository: Repository<ProjectFinancialSummary>,
    @InjectRepository(Supplier)
    private readonly supplierRepository: Repository<Supplier>,
    @InjectRepository(ProjectMetadata)
    private readonly projectMetadataRepository: Repository<ProjectMetadata>,
    @InjectRepository(ProjectSettings)
    private readonly projectSettingsRepository: Repository<ProjectSettings>,
    @InjectRepository(PhaseFinancialSummary)
    private readonly phaseFinancialSummaryRepository: Repository<PhaseFinancialSummary>,
    @InjectRepository(UserPreferences)
    private readonly userPreferencesRepository: Repository<UserPreferences>,
    @InjectRepository(UserSession)
    private readonly userSessionRepository: Repository<UserSession>,
    @InjectRepository(TransactionAttachment)
    private readonly transactionAttachmentRepository: Repository<TransactionAttachment>,
    @InjectRepository(TransactionApprovalHistory)
    private readonly transactionApprovalHistoryRepository: Repository<TransactionApprovalHistory>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    @InjectRepository(InventoryUsageLog)
    private readonly inventoryUsageLogRepository: Repository<InventoryUsageLog>,
    @InjectRepository(ProjectBoq)
    private readonly projectBoqRepository: Repository<ProjectBoq>,
    @Inject(forwardRef(() => ProjectsService))
    private readonly projectsService: ProjectsService,
    @Inject(forwardRef(() => ProjectPhaseService))
    private readonly projectPhaseService: ProjectPhaseService,
    @Inject(forwardRef(() => SubPhasesService))
    private readonly subPhasesService: SubPhasesService
  ) {}

  async seed() {
    // Check if data already exists - if so, skip seeding
    // This prevents re-seeding on every server reload
    const existingUsersCount = await this.userRepository.count();
    const existingProjectsCount = await this.projectRepository.count();
    
    // Only seed if database is empty (no users and no projects)
    // Allow force re-seed with FORCE_SEED environment variable
    if (existingUsersCount > 0 || existingProjectsCount > 0) {
      if (process.env.FORCE_SEED !== 'true') {
        // Database already has data, skip seeding
        return;
      }
    }

    // Seed Departments (6 departments)
    const departments = await this.seedDepartments();

    // Seed Users (15-20 users with proper roles)
    const users = await this.seedUsers(departments);

    // Seed Admin users
    const admins = await this.seedAdmins();

    // Seed Projects (12-15 with realistic Tanzanian budgets)
    const projects = await this.seedProjects(users, departments);

    // Seed Phases (3-6 per project)
    const phases = await this.seedPhases(projects, users);

    // Seed Tasks
    const tasks = await this.seedTasks(projects, phases, users);

    // Seed Financial Data
    await this.seedFinancialData(projects, users);

    // Seed Activities (50+ audit log entries)
    await this.seedActivities(users, projects, tasks);

    // Seed Reports
    await this.seedReports(users);

    // Seed Comments
    await this.seedComments(users, projects, tasks);

    // Seed Complaints
    await this.seedComplaints(users, projects, phases);

    // Seed Inventory Items
    await this.seedInventoryItems(users, projects);

    // Seed new normalized tables
    await this.seedUserPreferences(users);
    await this.seedUserSessions(users);
    await this.seedProjectMetadata(projects);
    await this.seedProjectSettings(projects);
    await this.seedPhaseFinancialSummaries(phases);
    await this.seedTransactionAttachments(projects);
    await this.seedTransactionApprovalHistory(projects);
    await this.seedAuditLogs(users, projects);
    await this.seedInventoryUsageLogs(users, projects, phases);

    // Seed BOQ Data and BOQ Phases (for View BOQ Phases area)
    await this.seedBOQData(projects, users);

    console.log("\n✅ Database seeding completed successfully!");
  }

  private async seedDepartments() {

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

  private async seedUsers(departments: Department[]) {


    const tanzanianUsers = [
      {
        email: "admin@kipimo.co.tz",
        password: "admin123",
        display_name: "Mwalimu Hassan Kikwete",
        role: UserRole.CONSULTANT,
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
        role: UserRole.USER,
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
        role: UserRole.FINANCE,
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
        role: UserRole.USER,
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
        role: UserRole.USER,
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
        role: UserRole.USER,
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
        role: UserRole.USER,
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
        role: UserRole.CONTRACTOR,
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
        role: UserRole.SUB_CONTRACTOR,
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
        role: UserRole.SUB_CONTRACTOR,
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
        role: UserRole.USER,
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
        role: UserRole.USER,
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
        role: UserRole.USER,
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
        role: UserRole.USER,
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
        role: UserRole.USER,
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
        role: UserRole.CONSULTANT,
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
        role: UserRole.USER,
        department: departments[0],
        bio: "Mhandisi Mwanzo",
        phone: "+255 713 567 890",
        location: "Shinyanga",
        status: "active",
      },
      // Add some inactive users for realistic data
      {
        email: "former@kipimo.co.tz",
        password: "old123",
        display_name: "Ahmed Mwalimu",
        role: UserRole.USER,
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
        console.log(
          `   ✓ Created user: ${userData.display_name} (${userData.email})`
        );
      }
      users.push(user);
    }
    return users;
  }

  private async seedAdmins() {

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
          last_login: new Date(
            Date.now() - Math.random() * 24 * 60 * 60 * 1000
          ),
        });
        await this.adminRepository.save(admin);

      }
      admins.push(admin);
    }
    return admins;
  }

  private async seedProjects(users: User[], departments: Department[]) {
    console.log("\n🏗️  Seeding Projects using ProjectsService...");

    const tanzanianProjects = [
      {
        title: "Mradi wa Barabara ya Dar es Salaam - Dodoma",
        description:
          "Ujenzi wa barabara ya lami kutoka Dar es Salaam hadi Dodoma kwa umbali wa km 450",
        status: ProjectStatus.IN_PROGRESS,
        priority: ProjectPriority.HIGH,
        totalBudget: 125000000000, // TSh 125 Billion
        location: "Tanzania Mainland",
        tags: ["barabara", "infrastructure", "lami"],
        department: departments[0],
      },
      {
        title: "Ujenzi wa Hospitali ya Rufaa Mwanza",
        description:
          "Ujenzi wa hospitali ya rufaa ya kisasa huko Mwanza na vifaa vya hali ya juu",
        status: ProjectStatus.IN_PROGRESS,
        priority: ProjectPriority.URGENT,
        totalBudget: 75000000000, // TSh 75 Billion
        location: "Mwanza",
        tags: ["hospitali", "afya", "ujenzi"],
        department: departments[0],
      },
      {
        title: "Mradi wa Uwandani wa Kilimo Dodoma",
        description:
          "Uongozi wa uwandani wa umwagiliaji na mazao ya kilimo kwa wakulima 5000",
        status: ProjectStatus.PLANNING,
        priority: ProjectPriority.MEDIUM,
        totalBudget: 25000000000, // TSh 25 Billion
        location: "Dodoma",
        tags: ["kilimo", "umwagiliaji", "maendeleo"],
        department: departments[0],
      },
      {
        title: "Mfumo wa Elimu ya Kidijitali Tanzania",
        description:
          "Kuanzisha mfumo wa elimu ya kidijitali katika shule 1000 nchini",
        status: ProjectStatus.IN_PROGRESS,
        priority: ProjectPriority.HIGH,
        totalBudget: 50000000000, // TSh 50 Billion
        location: "Tanzania",
        tags: ["elimu", "teknolojia", "kidijitali"],
        department: departments[0],
      },
      {
        title: "Ujenzi wa Bandari la Mtwara",
        description:
          "Upanuzi na uboreshaji wa bandari la Mtwara kwa mizigo na wasafiri",
        status: ProjectStatus.IN_PROGRESS,
        priority: ProjectPriority.HIGH,
        totalBudget: 200000000000, // TSh 200 Billion
        location: "Mtwara",
        tags: ["bandari", "bahari", "biashara"],
        department: departments[0],
      },
      {
        title: "Mradi wa Umeme wa Jua Singida",
        description:
          "Ujenzi wa kituo cha umeme wa jua chenye uwezo wa MW 100 huko Singida",
        status: ProjectStatus.PLANNING,
        priority: ProjectPriority.MEDIUM,
        totalBudget: 80000000000, // TSh 80 Billion
        location: "Singida",
        tags: ["umeme", "jua", "nishati"],
        department: departments[0],
      },
      {
        title: "Ujenzi wa Shule za Sekondari 50 Pemba",
        description: "Ujenzi wa shule 50 za sekondari katika kisiwa cha Pemba",
        status: ProjectStatus.COMPLETED,
        priority: ProjectPriority.MEDIUM,
        totalBudget: 30000000000, // TSh 30 Billion
        location: "Pemba, Zanzibar",
        tags: ["elimu", "ujenzi", "shule"],
        department: departments[0],
      },
      {
        title: "Mradi wa Maji Safi Kigoma",
        description:
          "Ujenzi wa mfumo wa usambazaji maji safi kwa wakazi 200,000 Kigoma",
        status: ProjectStatus.IN_PROGRESS,
        priority: ProjectPriority.HIGH,
        totalBudget: 35000000000, // TSh 35 Billion
        location: "Kigoma",
        tags: ["maji", "afya", "mazingira"],
        department: departments[0],
      },
      {
        title: "Kampeni ya Umasishani wa Utalii",
        description:
          "Kampeni ya kuongeza utalii wa kimataifa Tanzania kwa miaka 3",
        status: ProjectStatus.IN_PROGRESS,
        priority: ProjectPriority.MEDIUM,
        totalBudget: 15000000000, // TSh 15 Billion
        location: "Tanzania",
        tags: ["utalii", "umasishani", "uchumi"],
        department: departments[0],
      },
      {
        title: "Ujenzi wa Uwanja wa Ndege Songwe",
        description:
          "Ujenzi wa uwanja wa ndege wa kimataifa huko Songwe, Mbeya",
        status: ProjectStatus.COMPLETED,
        priority: ProjectPriority.HIGH,
        totalBudget: 180000000000, // TSh 180 Billion
        location: "Mbeya",
        tags: ["ndege", "uwanja", "kimataifa"],
        department: departments[0],
      },
      {
        title: "Mradi wa Maendeleo ya Vijiji 100",
        description:
          "Kujenga miundombinu ya msingi katika vijiji 100 vya umaarufu",
        status: ProjectStatus.ON_HOLD,
        priority: ProjectPriority.LOW,
        totalBudget: 40000000000, // TSh 40 Billion
        location: "Tanzania",
        tags: ["vijiji", "maendeleo", "miundombinu"],
        department: departments[0],
      },
      {
        title: "Ujenzi wa Kituo cha Utafiti Kilimo",
        description:
          "Ujenzi wa kituo cha utafiti wa kilimo chenye vifaa vya kisasa",
        status: ProjectStatus.CANCELLED,
        priority: ProjectPriority.LOW,
        totalBudget: 12000000000, // TSh 12 Billion
        location: "Morogoro",
        tags: ["kilimo", "utafiti", "sayansi"],
        department: departments[0],
      },
    ];

    // Only use consultants as project owners (contractors/sub-contractors will be assigned later)
    const consultants = users.filter(u => u.role === UserRole.CONSULTANT && u.status === "active");
    if (consultants.length === 0) {
      console.log("   ⚠️  No consultants found. Projects need consultants as owners.");
      return [];
    }

    const projects = [];
    for (let i = 0; i < tanzanianProjects.length; i++) {
      const projectData = tanzanianProjects[i];
      // Always use a consultant as the owner
      const owner = consultants[i % consultants.length];

      let project = await this.projectRepository.findOne({
        where: { title: projectData.title },
      });

      if (!project) {
        // Use ProjectsService.create() to follow current functionalities
        const createProjectDto: CreateProjectDto = {
          title: projectData.title,
          description: projectData.description,
          status: projectData.status,
          priority: projectData.priority,
          totalAmount: projectData.totalBudget,
          tags: projectData.tags,
          start_date: new Date(
            Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
          ).toISOString(),
          end_date: new Date(
            Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000
          ).toISOString(),
        };

        // Add only consultants as collaborators (contractors/sub-contractors will be assigned later)
        const collaboratorCount = 1 + Math.floor(Math.random() * 2); // 1-2 consultant collaborators
        const availableConsultants = consultants.filter(
          (u) => u.id !== owner.id && u.status === "active"
        );
        const selectedCollaborators = availableConsultants
          .sort(() => 0.5 - Math.random())
          .slice(0, collaboratorCount);
        createProjectDto.collaborator_ids = selectedCollaborators.map(u => u.id);

        // Create project using service (this will also create financial summary, metadata, settings)
        project = await this.projectsService.create(createProjectDto, owner);

        // Update financial summary with realistic spent amounts based on status
        const financialSummary = await this.financialSummaryRepository.findOne({
          where: { project_id: project.id },
        });
        if (financialSummary) {
          let spentAmount = 0;
          let estimatedSavings = 0;
          let financialStatus:
            | "on_track"
            | "warning"
            | "over_budget"
            | "excellent" = "on_track";

          switch (projectData.status) {
            case ProjectStatus.COMPLETED:
              spentAmount =
                projectData.totalBudget * (0.85 + Math.random() * 0.1); // 85-95%
              estimatedSavings = projectData.totalBudget - spentAmount;
              financialStatus = "excellent";
              break;
            case ProjectStatus.IN_PROGRESS:
              spentAmount = projectData.totalBudget * (0.4 + Math.random() * 0.4); // 40-80%
              estimatedSavings =
                projectData.totalBudget * (0.05 + Math.random() * 0.1); // 5-15%
              financialStatus = Math.random() > 0.7 ? "warning" : "on_track";
              break;
            case ProjectStatus.PLANNING:
              spentAmount =
                projectData.totalBudget * (0.05 + Math.random() * 0.1); // 5-15%
              estimatedSavings = 0;
              financialStatus = "on_track";
              break;
            case ProjectStatus.ON_HOLD:
              spentAmount = projectData.totalBudget * (0.2 + Math.random() * 0.3); // 20-50%
              estimatedSavings = 0;
              financialStatus = "warning";
              break;
            case ProjectStatus.CANCELLED:
              spentAmount = projectData.totalBudget * (0.1 + Math.random() * 0.2); // 10-30%
              estimatedSavings = -spentAmount; // Negative savings for cancelled projects
              financialStatus = "over_budget";
              break;
          }

          financialSummary.spentAmount = spentAmount;
          financialSummary.estimatedSavings = estimatedSavings;
          financialSummary.financialStatus = financialStatus;
          await this.financialSummaryRepository.save(financialSummary);
        }

        console.log(
          `   ✓ Created project: ${project.title} (Budget: TSh ${(projectData.totalBudget / 1000000000).toFixed(1)}B)`
        );
      }
      projects.push(project);
    }
    console.log(`   ✓ Created ${projects.length} projects using ProjectsService`);
    return projects;
  }

  private async seedPhases(projects: Project[], users: User[]) {
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

    // Only use consultants - contractors/sub-contractors will be assigned by consultants later
    const consultants = users.filter(u => u.role === UserRole.CONSULTANT && u.status === "active");
    if (consultants.length === 0) {
      console.log("   ⚠️  No consultants found. Skipping phase creation.");
      return [];
    }

    const allPhases: Phase[] = [];

    for (const project of projects) {
      // Create 2-4 consultant phases per project (these are planning/oversight phases)
      const numPhases = 2 + Math.floor(Math.random() * 3); // 2-4 phases per project
      
      // Get financial summary for budget
      const financialSummary = await this.financialSummaryRepository.findOne({
        where: { project_id: project.id },
      });
      const projectBudget = financialSummary?.totalBudget || project.totalAmount || 0;
      const phaseBudget = projectBudget / (numPhases + 1); // Reserve budget for future contractor phases

      // Create only consultant/legacy phases (contractors will create their phases after being assigned)
      for (let i = 0; i < numPhases; i++) {
        const phaseTemplate = phaseTemplates[i % phaseTemplates.length];
        const consultant = consultants[Math.floor(Math.random() * consultants.length)];

        let status = PhaseStatus.NOT_STARTED;
        let progress = 0;

        // Set realistic phase status based on project status
        if (project.status === ProjectStatus.COMPLETED) {
          if (i < numPhases / 2) {
            status = PhaseStatus.COMPLETED;
            progress = 100;
          }
        } else if (project.status === ProjectStatus.IN_PROGRESS) {
          if (i === 0) {
            status = PhaseStatus.IN_PROGRESS;
            progress = 30 + Math.random() * 50; // 30-80% progress
          } else if (i === 1 && Math.random() > 0.5) {
            status = PhaseStatus.IN_PROGRESS;
            progress = 10 + Math.random() * 40; // 10-50% progress
          }
        } else if (project.status === ProjectStatus.PLANNING && i === 0) {
          status = PhaseStatus.IN_PROGRESS;
          progress = 20 + Math.random() * 30; // 20-50% progress
        }

        const createPhaseDto: CreatePhaseDto = {
          title: `${phaseTemplate.title} - ${project.title.split(" ").slice(0, 3).join(" ")}`,
          description: `${phaseTemplate.description} - Consultant planning and oversight phase`,
          budget: phaseBudget,
          progress,
          status,
          startDate: new Date(
            Date.now() - Math.random() * 100 * 24 * 60 * 60 * 1000
          ).toISOString(),
          endDate: new Date(
            Date.now() + Math.random() * 200 * 24 * 60 * 60 * 1000
          ).toISOString(),
          dueDate: new Date(
            Date.now() + Math.random() * 150 * 24 * 60 * 60 * 1000
          ).toISOString(),
        };

        try {
          // Use ProjectPhaseService to create legacy phase (for consultants)
          // This creates phases that consultants can see and manage
          const phase = await this.projectPhaseService.createPhase(
            project.id,
            createPhaseDto,
            consultant.id
          );
          allPhases.push(phase as Phase);
          
          // Create sub-phases for this consultant phase
          await this.seedSubPhasesForPhase(phase.id, status, 'legacy');
        } catch (error) {
          console.error(`   ⚠️  Error creating consultant phase: ${error.message}`);
        }
      }
    }

    console.log(`   ✓ Created ${allPhases.length} consultant phases (contractors will be assigned and create their phases later)`);
    return allPhases;
  }

  private async seedSubPhasesForPhase(
    phaseId: string,
    phaseStatus: PhaseStatus,
    phaseType: 'contractor' | 'sub_contractor' | 'legacy'
  ) {
    // Define sub-phase templates based on phase title/description
    const subPhaseTemplates: {
      [key: string]: Array<{ title: string; description?: string }>;
    } = {
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

    // Load phase to get title and description
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
    } else if (phaseType === 'sub_contractor') {
      const subContractorPhase = await this.subContractorPhaseRepository.findOne({
        where: { id: phaseId },
      });
      if (subContractorPhase) {
        phaseTitle = subContractorPhase.title || '';
        phaseDescription = subContractorPhase.description || '';
        phaseProgress = subContractorPhase.progress || 0;
      }
    } else {
      const legacyPhase = await this.phaseRepository.findOne({
        where: { id: phaseId },
      });
      if (legacyPhase) {
        phaseTitle = legacyPhase.title || '';
        phaseDescription = legacyPhase.description || '';
        phaseProgress = legacyPhase.progress || 0;
      }
    }

    // Find matching template based on phase title or description
    // Phase title format is: "Template Title - Project Name", so we check if title contains the key
    let subPhasesToCreate: Array<{ title: string; description?: string }> = [];
    for (const [key, templates] of Object.entries(subPhaseTemplates)) {
      if (phaseTitle.includes(key) || phaseDescription?.includes(key)) {
        subPhasesToCreate = templates;
        break;
      }
    }

    // Default sub-phases if no match found
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

    // Determine how many sub-phases should be completed based on phase status
    let completedCount = 0;
    if (phaseStatus === PhaseStatus.COMPLETED) {
      completedCount = subPhasesToCreate.length; // All completed
    } else if (phaseStatus === PhaseStatus.IN_PROGRESS) {
      // Complete some sub-phases based on progress
      const progressRatio = phaseProgress / 100;
      completedCount = Math.floor(subPhasesToCreate.length * progressRatio);
    }

    // Get a user for creating sub-phases (use contractor for contractor phases, sub-contractor for sub-contractor phases)
    const users = await this.userRepository.find({ where: { status: "active" } });
    const contractors = users.filter(u => u.role === UserRole.CONTRACTOR);
    const subContractors = users.filter(u => u.role === UserRole.SUB_CONTRACTOR);
    const consultants = users.filter(u => u.role === UserRole.CONSULTANT);
    
    let user: User;
    if (phaseType === 'contractor' && contractors.length > 0) {
      user = contractors[Math.floor(Math.random() * contractors.length)];
    } else if (phaseType === 'sub_contractor' && subContractors.length > 0) {
      user = subContractors[Math.floor(Math.random() * subContractors.length)];
    } else if (consultants.length > 0) {
      user = consultants[Math.floor(Math.random() * consultants.length)];
    } else {
      user = users[0];
    }

    // Create sub-phases using SubPhasesService
    for (let i = 0; i < subPhasesToCreate.length; i++) {
      const template = subPhasesToCreate[i];
      const isCompleted = i < completedCount;

      try {
        await this.subPhasesService.create(
          phaseId,
          {
            title: template.title,
            description: template.description,
            isCompleted,
          },
          user
        );
      } catch (error) {
        console.error(`   ⚠️  Error creating sub-phase "${template.title}": ${error.message}`);
      }
    }
  }

  private async seedTasks(projects: Project[], phases: Phase[], users: User[]) {


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
      const numTasks = 2 + Math.floor(Math.random() * 4); // 2-5 tasks per phase

      for (let i = 0; i < numTasks; i++) {
        const template =
          taskTemplates[Math.floor(Math.random() * taskTemplates.length)];
        const quantity = 1 + Math.random() * 100;

        // Ensure project_id is set - get it from phase if available
        const projectId = phase.project_id || (phase as any).project?.id || null;
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

  private async seedFinancialData(projects: Project[], users: User[]) {


    // Track all used transaction numbers across all projects to ensure global uniqueness
    const globalUsedTransactionNumbers = new Set<string>();

    for (const project of projects) {

      
      // Create more comprehensive budget categories
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
        // Get financial summary for budget
        const financialSummary = await this.financialSummaryRepository.findOne({
          where: { project_id: project.id },
        });
        const projectBudget = financialSummary?.totalBudget || project.totalAmount || 0;
        const budgetedAmount = projectBudget * categoryData.budgetPercentage;
        
        // Don't set spentAmount here - it will be calculated from transactions
        const category = this.budgetCategoryRepository.create({
          projectId: project.id,
          name: categoryData.name,
          description: categoryData.description || `Bajeti ya ${categoryData.name} kwa ${project.title}`,
          budgetedAmount,
          spentAmount: 0, // Will be calculated from transactions
          isActive: true,
          createdBy: users[0].id,
        });

        await this.budgetCategoryRepository.save(category);
        createdCategories.push(category);

        // Create more transactions for this category (5-15 transactions)
        await this.createTransactionsForCategory(category, users, globalUsedTransactionNumbers);
      }

      // Create some transactions without categories (general project expenses)
      await this.createGeneralProjectTransactions(project, users, globalUsedTransactionNumbers);

      // Recalculate category spent amounts from transactions
      for (const category of createdCategories) {
        await this.recalculateCategorySpentAmount(category.id);
      }

      // Recalculate project spent amount from all transactions
      await this.recalculateProjectSpentAmount(project.id);

      // Update project allocated budget - ensure all values are numbers
      const totalAllocated = createdCategories.reduce((sum, cat) => {
        const amount = typeof cat.budgetedAmount === 'number' 
          ? cat.budgetedAmount 
          : parseFloat(String(cat.budgetedAmount || 0)) || 0;
        return sum + amount;
      }, 0);
      
      // Validate and normalize the allocated budget
      const normalizedAllocated = Math.max(0, Math.min(totalAllocated, 9999999999999.99));
      
      // Update financial summary instead of project
      const financialSummary = await this.financialSummaryRepository.findOne({
        where: { project_id: project.id },
      });
      if (financialSummary) {
        financialSummary.allocatedBudget = normalizedAllocated;
        await this.financialSummaryRepository.save(financialSummary);
      }

      // Create savings records
      await this.createSavingsRecords(project, users[0]);

      // Create budget alerts if needed
      await this.createBudgetAlerts(project);
    }


  }

  private async recalculateCategorySpentAmount(categoryId: string) {
    const transactions = await this.transactionRepository.find({
      where: { categoryId },
    });

    // Sum all transaction amounts regardless of type
    const { sumAmounts, extractTransactionAmount } = await import('../utils/amount.utils');
    const totalSpent = transactions.reduce((sum, t) => {
      return sum + extractTransactionAmount(t);
    }, 0);

    const normalizedSpent = Math.max(0, totalSpent);
    await this.budgetCategoryRepository.update(categoryId, {
      spentAmount: normalizedSpent,
    });
  }

  private async recalculateProjectSpentAmount(projectId: string) {
    // CRITICAL: Filter by projectId to ensure we only get transactions for this specific project
    const transactions = await this.transactionRepository.find({
      where: { projectId },
    });

    // Sum all transaction amounts regardless of type
    // Defensive check: Ensure all transactions belong to the specified project
    const { extractTransactionAmount } = await import('../utils/amount.utils');
    const validTransactions = transactions.filter(t => {
      if (t.projectId !== projectId) {

        return false; // Skip this transaction to prevent cross-project contamination
      }
      return true;
    });

    const totalSpent = validTransactions.reduce((sum, t) => {
      return sum + extractTransactionAmount(t);
    }, 0);

    const normalizedSpent = Math.max(0, totalSpent);
    // Update financial summary instead of project
    const financialSummary = await this.financialSummaryRepository.findOne({
      where: { project_id: projectId },
    });
    if (financialSummary) {
      financialSummary.spentAmount = normalizedSpent;
      await this.financialSummaryRepository.save(financialSummary);
    }
  }

  private async createGeneralProjectTransactions(project: Project, users: User[], globalUsedNumbers: Set<string>) {
    // Create 3-8 general project transactions (not assigned to categories)
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
      const amount = Math.random() * 5000000 + 500000; // 500K - 5.5M TSh
      const now = new Date();
      const daysAgo = Math.floor(Math.random() * 90); // Last 90 days
      const transactionDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

      // Generate unique transaction number with timestamp and random component
      let transactionNumber: string;
      let attempts = 0;
      do {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000000);
        const uniqueId = `${timestamp}${random}${i}`;
        transactionNumber = `TXN${transactionDate.getFullYear()}${(transactionDate.getMonth() + 1).toString().padStart(2, "0")}${transactionDate.getDate().toString().padStart(2, "0")}${uniqueId.slice(-12)}`;
        attempts++;
        if (attempts > 100) {
          // Fallback: use UUID-like string if we can't generate unique number
          transactionNumber = `TXN${transactionDate.getFullYear()}${(transactionDate.getMonth() + 1).toString().padStart(2, "0")}${transactionDate.getDate().toString().padStart(2, "0")}${Math.random().toString(36).substring(2, 15).toUpperCase()}${i}`;
          break;
        }
      } while (globalUsedNumbers.has(transactionNumber));
      
      globalUsedNumbers.add(transactionNumber);

      // Mix of transaction types
      let transactionType = TransactionType.EXPENSE;
      if (Math.random() < 0.1) {
        transactionType = TransactionType.REFUND; // 10% refunds
      } else if (Math.random() < 0.15) {
        transactionType = TransactionType.ADJUSTMENT; // 15% adjustments
      }

      const transaction = this.transactionRepository.create({
        projectId: project.id,
        categoryId: null, // General project transaction
        transactionNumber,
        amount,
        type: transactionType,
        description: this.getRandomTransactionDescription("General"),
        vendor: tanzanianVendors[Math.floor(Math.random() * tanzanianVendors.length)],
        transactionDate,
        approvalStatus: Math.random() < 0.8 ? ApprovalStatus.APPROVED : ApprovalStatus.PENDING,
        approvedBy: transactionType === TransactionType.EXPENSE && Math.random() < 0.8 
          ? users[Math.floor(Math.random() * users.length)].id 
          : null,
        approvedAt: transactionType === TransactionType.EXPENSE && Math.random() < 0.8 
          ? transactionDate 
          : null,
        createdBy: users[Math.floor(Math.random() * users.length)].id,
      });

      await this.transactionRepository.save(transaction);
    }
  }

  private async createTransactionsForCategory(
    category: BudgetCategory,
    users: User[],
    globalUsedNumbers: Set<string>
  ) {
    // Create 5-15 transactions per category for more realistic data
    const transactionCount = Math.floor(Math.random() * 11) + 5; // 5-15 transactions
    const targetSpent = category.budgetedAmount * (0.4 + Math.random() * 0.5); // 40-90% of budget
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
    const projectStartDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000); // 180 days ago

    for (let i = 0; i < transactionCount; i++) {
      const remainingAmount = targetSpent - totalSpent;
      const maxAmount =
        i === transactionCount - 1
          ? remainingAmount
          : remainingAmount / (transactionCount - i);
      const amount = Math.min(maxAmount, Math.random() * maxAmount + 100000); // Minimum TSh 100,000

      // Spread transactions over the last 180 days
      const daysAgo = Math.floor(Math.random() * 180);
      const transactionDate = new Date(projectStartDate.getTime() + daysAgo * 24 * 60 * 60 * 1000);

      // Generate unique transaction number with timestamp and random component
      let transactionNumber: string;
      let attempts = 0;
      do {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000000);
        const uniqueId = `${timestamp}${random}${i}${category.id.slice(0, 4)}`;
        transactionNumber = `TXN${transactionDate.getFullYear()}${(transactionDate.getMonth() + 1).toString().padStart(2, "0")}${transactionDate.getDate().toString().padStart(2, "0")}${uniqueId.slice(-12)}`;
        attempts++;
        if (attempts > 100) {
          // Fallback: use UUID-like string if we can't generate unique number
          transactionNumber = `TXN${transactionDate.getFullYear()}${(transactionDate.getMonth() + 1).toString().padStart(2, "0")}${transactionDate.getDate().toString().padStart(2, "0")}${Math.random().toString(36).substring(2, 15).toUpperCase()}${i}`;
          break;
        }
      } while (globalUsedNumbers.has(transactionNumber));
      
      globalUsedNumbers.add(transactionNumber);

      // Mix of transaction types (mostly expenses, some refunds and adjustments)
      let transactionType = TransactionType.EXPENSE;
      if (Math.random() < 0.08) {
        transactionType = TransactionType.REFUND; // 8% refunds
      } else if (Math.random() < 0.12) {
        transactionType = TransactionType.ADJUSTMENT; // 12% adjustments
      }

      const isApproved = Math.random() < 0.85; // 85% approved
      const approvalStatus = isApproved ? ApprovalStatus.APPROVED : 
                            Math.random() < 0.5 ? ApprovalStatus.PENDING : ApprovalStatus.REJECTED;

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
        approvedBy: isApproved && transactionType === TransactionType.EXPENSE
          ? users[Math.floor(Math.random() * users.length)].id
          : null,
        approvedAt: isApproved && transactionType === TransactionType.EXPENSE
          ? transactionDate
          : null,
        createdBy: users[Math.floor(Math.random() * users.length)].id,
      });

      await this.transactionRepository.save(transaction);
      totalSpent += amount;

      await new Promise((resolve) => setTimeout(resolve, 5));
    }
  }

  private async createSavingsRecords(project: Project, user: User) {
    const financialSummary = await this.financialSummaryRepository.findOne({
      where: { project_id: project.id },
    });
    if (!financialSummary || financialSummary.estimatedSavings <= 0) return;

    const savingsCategories = [
      "Punguzo la Bei kwa Ununuzi wa Kwingi",
      "Malipo ya Mapema",
      "Mazungumzo ya Bei",
      "Uboreshaji wa Michakato",
      "Ugawaji Bora wa Rasilimali",
    ];

    for (let i = 0; i < Math.min(3, savingsCategories.length); i++) {
      const category = savingsCategories[i];
      const budgetedAmount = Math.random() * 5000000 + 1000000; // 1M - 6M TSh
      const actualAmount = budgetedAmount * (0.7 + Math.random() * 0.2); // 70-90% of budgeted

      const savings = this.savingsRepository.create({
        projectId: project.id,
        category,
        budgetedAmount,
        actualAmount,
        reason: this.getSavingsReason(category),
        description: `Akiba iliyopatikana kupitia ${category.toLowerCase()}`,
        achievedDate: new Date(
          Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
        ),
        verificationStatus: VerificationStatus.VERIFIED,
        verifiedBy: user.id,
        createdBy: user.id,
      });

      await this.savingsRepository.save(savings);
    }
  }

  private async createBudgetAlerts(project: Project) {
    const financialSummary = await this.financialSummaryRepository.findOne({
      where: { project_id: project.id },
    });
    if (!financialSummary) return;

    // Ensure values are numbers before calculation
    const totalBudget = typeof financialSummary.totalBudget === 'number' 
      ? financialSummary.totalBudget 
      : parseFloat(String(financialSummary.totalBudget || 0)) || 0;
    const spentAmount = typeof financialSummary.spentAmount === 'number' 
      ? financialSummary.spentAmount 
      : parseFloat(String(financialSummary.spentAmount || 0)) || 0;

    // Calculate utilization percentage and ensure it's valid
    let utilizationPercentage = 0;
    if (totalBudget > 0) {
      utilizationPercentage = (spentAmount / totalBudget) * 100;
    }

    // Validate and clamp percentage to fit in decimal(5,2) - max 999.99
    utilizationPercentage = Math.min(Math.max(utilizationPercentage, 0), 999.99);
    utilizationPercentage = Math.round(utilizationPercentage * 100) / 100; // Round to 2 decimals

    if (utilizationPercentage >= 95) {
      const alert = this.alertRepository.create({
        projectId: project.id,
        alertType: AlertType.CRITICAL,
        thresholdPercentage: 95,
        currentPercentage: utilizationPercentage,
        emailRecipients: ["finance.manager@kipimo.co.tz", "admin@kipimo.co.tz"],
        isActive: true,
      });
      await this.alertRepository.save(alert);
    } else if (utilizationPercentage >= 85) {
      const alert = this.alertRepository.create({
        projectId: project.id,
        alertType: AlertType.WARNING,
        thresholdPercentage: 85,
        currentPercentage: utilizationPercentage,
        emailRecipients: ["finance.manager@kipimo.co.tz"],
        isActive: true,
      });
      await this.alertRepository.save(alert);
    }
  }

  private async seedActivities(
    users: User[],
    projects: Project[],
    tasks: Task[]
  ) {
    const activityTemplates = [
      {
        type: ActivityType.PROJECT_CREATED,
        description: "Mradi mpya umeundwa",
      },
      {
        type: ActivityType.PROJECT_UPDATED,
        description: "Taarifa za mradi zimesasishwa",
      },
      { type: ActivityType.TASK_CREATED, description: "Kazi mpya imeongezwa" },
      { type: ActivityType.TASK_COMPLETED, description: "Kazi imekamilishwa" },
      {
        type: ActivityType.PHASE_COMPLETED,
        description: "Awamu imekamilishwa",
      },
      {
        type: ActivityType.COLLABORATOR_ADDED,
        description: "Mshirika ameongezwa kwenye mradi",
      },
      {
        type: ActivityType.BOQ_UPLOADED,
        description: "Orodha ya vifaa imepakiwa",
      },
      { type: ActivityType.COMMENT_ADDED, description: "Maoni yameongezwa" },
    ];

    const activities = [];
    for (let i = 0; i < 75; i++) {
      // Create 75 activities
      const template =
        activityTemplates[Math.floor(Math.random() * activityTemplates.length)];
      const user =
        users[
          Math.floor(
            Math.random() * users.filter((u) => u.status === "active").length
          )
        ];
      const project = projects[Math.floor(Math.random() * projects.length)];
      const task =
        Math.random() > 0.5
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
        created_at: new Date(
          Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000
        ), // Last 90 days
      });

      await this.activityRepository.save(activity);
      activities.push(activity);
    }


    return activities;
  }

  private async seedReports(users: User[]) {


    const reportData = [
      {
        name: "Ripoti ya Fedha - Mwezi wa 12",
        description: "Ripoti ya jumla ya matumizi ya fedha mwezi wa Desemba",
        type: ReportType.XLSX,
        status: ReportStatus.READY,
        fileName: "ripoti_fedha_desemba_2024.xlsx",
        fileSize: 2048576, // 2MB
      },
      {
        name: "Takwimu za Miradi - Q4 2024",
        description: "Muhtasari wa maendeleo ya miradi robo ya nne 2024",
        type: ReportType.PDF,
        status: ReportStatus.READY,
        fileName: "takwimu_miradi_q4_2024.pdf",
        fileSize: 5242880, // 5MB
      },
      {
        name: "Jedwali la Shughuli - Januari",
        description: "Jedwali la shughuli zote za mwezi wa Januari",
        type: ReportType.CSV,
        status: ReportStatus.PROCESSING,
        fileName: null,
        fileSize: null,
        progress: 65,
      },
      {
        name: "Ripoti ya Wafanyakazi",
        description: "Takwimu za wafanyakazi na utendaji wao",
        type: ReportType.JSON,
        status: ReportStatus.FAILED,
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
        progress:
          data.progress || (data.status === ReportStatus.READY ? 100 : 0),
        generated_by: users[Math.floor(Math.random() * users.length)].id,
        dateFrom: new Date(2024, 0, 1), // January 1, 2024
        dateTo: new Date(2024, 11, 31), // December 31, 2024
        retentionDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days retention
      });

      await this.reportRepository.save(report);
    }


  }

  private async seedComments(
    users: User[],
    projects: Project[],
    tasks: Task[]
  ) {


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
      // Create 40 comments
      const user =
        users[
          Math.floor(
            Math.random() * users.filter((u) => u.status === "active").length
          )
        ];
      const project = projects[Math.floor(Math.random() * projects.length)];
      const task =
        Math.random() > 0.6
          ? tasks[Math.floor(Math.random() * tasks.length)]
          : null; // 40% chance of task comment
      const commentText =
        commentTexts[Math.floor(Math.random() * commentTexts.length)];

      const comment = this.commentRepository.create({
        content: commentText,
        author_id: user.id,
        project_id: project.id,
        task_id: task?.id || null,
        created_at: new Date(
          Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000
        ), // Last 60 days
      });

      await this.commentRepository.save(comment);
    }


  }

  private async seedComplaints(
    users: User[],
    projects: Project[],
    phases: Phase[]
  ) {


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
    const activeProjects = projects.filter(
      (p) => p.status !== ProjectStatus.CANCELLED
    );

    // Get all sub-phases for the phases
    const phaseIds = phases.map((p) => p.id);
    const allSubPhases =
      phaseIds.length > 0
        ? await this.subPhaseRepository
            .createQueryBuilder("subPhase")
            .where("subPhase.phase_id IN (:...phaseIds)", { phaseIds })
            .getMany()
        : [];

    for (let i = 0; i < 25; i++) {
      // Create 25 complaints
      const project =
        activeProjects[Math.floor(Math.random() * activeProjects.length)];
      const projectPhases = phases.filter((p) => p.project_id === project.id);
      const phase =
        projectPhases.length > 0 && Math.random() > 0.3
          ? projectPhases[Math.floor(Math.random() * projectPhases.length)]
          : null;
      const subPhase =
        phase && allSubPhases.length > 0 && Math.random() > 0.5
          ? allSubPhases.find((sp) => sp.phase_id === phase.id) || null
          : null;

      const raiser =
        activeUsers[Math.floor(Math.random() * activeUsers.length)];
      const title =
        complaintTitles[Math.floor(Math.random() * complaintTitles.length)];
      const description =
        complaintDescriptions[
          Math.floor(Math.random() * complaintDescriptions.length)
        ];

      // Determine status: 60% open, 30% resolved, 10% appealed
      let status = ComplaintStatus.OPEN;
      let response: string | null = null;
      let respondedBy: string | null = null;
      let respondedAt: Date | null = null;
      let appealReason: string | null = null;
      let appealedAt: Date | null = null;

      const statusRoll = Math.random();
      if (statusRoll > 0.4) {
        // Resolved or Appealed
        if (statusRoll > 0.9) {
          // 10% appealed
          status = ComplaintStatus.APPEALED;
          appealReason =
            appealReasons[Math.floor(Math.random() * appealReasons.length)];
          appealedAt = new Date(
            Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
          );
          // Still has a response (was resolved first, then appealed)
          response =
            responseTexts[Math.floor(Math.random() * responseTexts.length)];
          const responder =
            activeUsers[Math.floor(Math.random() * activeUsers.length)];
          respondedBy = responder.id;
          respondedAt = new Date(
            appealedAt.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000
          );
        } else {
          // 30% resolved
          status = ComplaintStatus.RESOLVED;
          response =
            responseTexts[Math.floor(Math.random() * responseTexts.length)];
          const responder =
            activeUsers[Math.floor(Math.random() * activeUsers.length)];
          respondedBy = responder.id;
          respondedAt = new Date(
            Date.now() - Math.random() * 45 * 24 * 60 * 60 * 1000
          );
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
        created_at: new Date(
          Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000
        ), // Last 90 days
      });

      await this.complaintRepository.save(complaint);
    }


  }

  private getRandomTransactionDescription(categoryName: string): string {
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

    return categoryDescriptions[
      Math.floor(Math.random() * categoryDescriptions.length)
    ];
  }

  private getSavingsReason(category: string): string {
    const reasons = {
      "Punguzo la Bei kwa Ununuzi wa Kwingi":
        "Punguzo la bei kwa ununuzi wa wingi mkubwa",
      "Malipo ya Mapema": "Punguzo kwa malipo ya haraka ndani ya siku 10",
      "Mazungumzo ya Bei": "Mazungumzo ya mafanikio ya kupunguza bei",
      "Uboreshaji wa Michakato": "Uboreshaji wa ufanisi uliopunguza gharama",
      "Ugawaji Bora wa Rasilimali":
        "Matumizi mazuri ya rasilimali yaliyopunguza gharama",
    };

    return (
      reasons[category] || "Uongozi mzuri wa gharama kupitia mipango ya kisera"
    );
  }

  private getMimeType(reportType: ReportType): string {
    switch (reportType) {
      case ReportType.PDF:
        return "application/pdf";
      case ReportType.XLSX:
        return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      case ReportType.CSV:
        return "text/csv";
      case ReportType.JSON:
        return "application/json";
      default:
        return "application/octet-stream";
    }
  }

  private async seedInventoryItems(users: User[], projects: Project[]) {


    const inventoryItems = [
      // Materials
      {
        name: "Cement (Portland)",
        description: "High quality Portland cement for construction",
        unit: "bag",
        unit_price: 12000,
        category: InventoryCategory.MATERIALS,
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
        description:
          "Grade 60 steel reinforcement bars for concrete structures",
        unit: "ton",
        unit_price: 1200000,
        category: InventoryCategory.MATERIALS,
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
        category: InventoryCategory.MATERIALS,
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
        category: InventoryCategory.MATERIALS,
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
        category: InventoryCategory.MATERIALS,
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
        category: InventoryCategory.MATERIALS,
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
        category: InventoryCategory.MATERIALS,
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
        category: InventoryCategory.MATERIALS,
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
        category: InventoryCategory.MATERIALS,
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
        category: InventoryCategory.MATERIALS,
        brand: "TileMaster",
        supplier: "Tanzania Tile Importers",
        supplier_contact: "+255 757 456 789",
        quantity_available: 300,
        minimum_stock: 100,
        sku: "MAT-TIL-3030",
        is_active: true,
      },
      // Equipment
      {
        name: "Excavator (CAT 320)",
        description: "Heavy-duty excavator for earthworks",
        unit: "hour",
        unit_price: 150000,
        category: InventoryCategory.EQUIPMENT,
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
        category: InventoryCategory.EQUIPMENT,
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
        category: InventoryCategory.EQUIPMENT,
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
        category: InventoryCategory.EQUIPMENT,
        brand: "AirTech",
        model: "AT-200",
        supplier: "Tanzania Tools & Equipment",
        supplier_contact: "+255 759 678 901",
        quantity_available: 4,
        minimum_stock: 2,
        sku: "EQP-COM-200",
        is_active: true,
      },
      // Tools
      {
        name: "Hammer Drill",
        description: "Electric hammer drill for masonry",
        unit: "piece",
        unit_price: 180000,
        category: InventoryCategory.TOOLS,
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
        category: InventoryCategory.TOOLS,
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
        category: InventoryCategory.TOOLS,
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
        category: InventoryCategory.TOOLS,
        brand: "Stabila",
        supplier: "Tanzania Tool Distributors",
        supplier_contact: "+255 22 290 1234",
        quantity_available: 12,
        minimum_stock: 4,
        sku: "TOL-LVL-001",
        is_active: true,
      },
      // Low stock items (for testing alerts)
      {
        name: "Safety Helmets",
        description: "Construction safety helmets",
        unit: "piece",
        unit_price: 25000,
        category: InventoryCategory.EQUIPMENT,
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
        category: InventoryCategory.EQUIPMENT,
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
        category: InventoryCategory.MATERIALS,
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
    const financeUsers = users.filter(
      (u) => u.role === UserRole.FINANCE || u.role === UserRole.CONSULTANT
    );
    const randomUser =
      financeUsers[Math.floor(Math.random() * financeUsers.length)] || users[0];

    for (const itemData of inventoryItems) {
      // Handle supplier - find or create supplier
      let supplierId: string | null = null;
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

  private async seedUserPreferences(users: User[]) {
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
            financial_updates: user.role === UserRole.FINANCE || user.role === UserRole.CONSULTANT,
            inventory_alerts: user.role === UserRole.FINANCE || user.role === UserRole.CONSULTANT,
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

  private async seedUserSessions(users: User[]) {
    console.log("\n🔐 Seeding User Sessions...");
    const activeUsers = users.filter((u) => u.status === "active").slice(0, 10);
    let sessionCount = 0;
    for (const user of activeUsers) {
      // Create 1-3 sessions per user
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
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          is_active: Math.random() > 0.3, // 70% active
          last_activity: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
          location: "Dar es Salaam, Tanzania",
        });
        await this.userSessionRepository.save(session);
        sessionCount++;
      }
    }
    console.log(`   ✓ Created ${sessionCount} user sessions`);
  }

  private async seedProjectMetadata(projects: Project[]) {
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

  private async seedProjectSettings(projects: Project[]) {
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
          approval_threshold: 1000000, // TSh 1M
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

  private async seedPhaseFinancialSummaries(phases: Phase[]) {
    console.log("\n💰 Seeding Phase Financial Summaries...");
    for (const phase of phases) {
      const existing = await this.phaseFinancialSummaryRepository.findOne({
        where: { phase_id: phase.id },
      });
      if (!existing) {
        const budget = phase.budget || 0;
        const spent = budget * (0.3 + Math.random() * 0.5); // 30-80% spent
        const estimated = budget * (0.9 + Math.random() * 0.1); // 90-100% estimated
        const actual = spent * (0.95 + Math.random() * 0.1); // 95-105% of spent
        const variance = actual - estimated;
        let financialStatus: "on_track" | "warning" | "over_budget" = "on_track";
        if (variance > budget * 0.1) {
          financialStatus = "over_budget";
        } else if (variance > budget * 0.05) {
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

  private async seedTransactionAttachments(projects: Project[]) {
    console.log("\n📎 Seeding Transaction Attachments...");
    let attachmentCount = 0;
    for (const project of projects) {
      const transactions = await this.transactionRepository.find({
        where: { projectId: project.id },
        take: 10, // Limit to 10 transactions per project
      });
      for (const transaction of transactions.slice(0, Math.floor(transactions.length * 0.6))) {
        // Add attachments to 60% of transactions
        const numAttachments = Math.floor(Math.random() * 3) + 1; // 1-3 attachments
        for (let i = 0; i < numAttachments; i++) {
          const attachment = this.transactionAttachmentRepository.create({
            transactionId: transaction.id,
            type: i === 0 ? AttachmentType.RECEIPT : 
                  i === 1 ? AttachmentType.INVOICE : 
                  AttachmentType.OTHER,
            file_url: `https://storage.example.com/transactions/${transaction.id}/attachment-${i + 1}.pdf`,
            file_name: `${transaction.transactionNumber}-${i === 0 ? "receipt" : i === 1 ? "invoice" : "document"}-${i + 1}.pdf`,
            file_mime_type: "application/pdf",
            file_size: 100000 + Math.floor(Math.random() * 500000), // 100KB - 600KB
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

  private async seedTransactionApprovalHistory(projects: Project[]) {
    console.log("\n✅ Seeding Transaction Approval History...");
    let historyCount = 0;
    for (const project of projects) {
      const transactions = await this.transactionRepository.find({
        where: { projectId: project.id, approvalStatus: ApprovalStatus.APPROVED },
        take: 15,
      });
      for (const transaction of transactions) {
        if (transaction.approvedBy && transaction.approvedAt) {
          const history = this.transactionApprovalHistoryRepository.create({
            transactionId: transaction.id,
            action: ApprovalAction.APPROVED,
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

  private async seedAuditLogs(users: User[], projects: Project[]) {
    console.log("\n📊 Seeding Audit Logs...");
    const auditActions = [
      { action: AuditAction.CREATE, entity: AuditEntityType.PROJECT },
      { action: AuditAction.UPDATE, entity: AuditEntityType.PROJECT },
      { action: AuditAction.VIEW, entity: AuditEntityType.PROJECT },
      { action: AuditAction.CREATE, entity: AuditEntityType.TRANSACTION },
      { action: AuditAction.APPROVE, entity: AuditEntityType.TRANSACTION },
      { action: AuditAction.CREATE, entity: AuditEntityType.INVENTORY },
      { action: AuditAction.UPDATE, entity: AuditEntityType.INVENTORY },
      { action: AuditAction.LOGIN, entity: AuditEntityType.USER },
      { action: AuditAction.EXPORT, entity: AuditEntityType.REPORT },
    ];
    let logCount = 0;
    for (let i = 0; i < 100; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const auditTemplate = auditActions[Math.floor(Math.random() * auditActions.length)];
      const project = projects[Math.floor(Math.random() * projects.length)];
      const log = this.auditLogRepository.create({
        action: auditTemplate.action,
        entity_type: auditTemplate.entity,
        entity_id: auditTemplate.entity === AuditEntityType.PROJECT ? project.id : 
                   auditTemplate.entity === AuditEntityType.USER ? user.id : 
                   crypto.randomUUID(),
        userId: user.id,
        description: `${auditTemplate.action} ${auditTemplate.entity} by ${user.display_name}`,
        old_values: auditTemplate.action === AuditAction.UPDATE ? { status: "old" } : null,
        new_values: auditTemplate.action === AuditAction.UPDATE ? { status: "new" } : null,
        ip_address: `192.168.1.${Math.floor(Math.random() * 255)}`,
        user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        is_successful: Math.random() > 0.1, // 90% successful
        error_message: Math.random() > 0.9 ? "Sample error message" : null,
      });
      await this.auditLogRepository.save(log);
      logCount++;
    }
    console.log(`   ✓ Created ${logCount} audit log entries`);
  }

  private async seedInventoryUsageLogs(users: User[], projects: Project[], phases: Phase[]) {
    console.log("\n📦 Seeding Inventory Usage Logs...");
    const inventoryItems = await this.inventoryRepository.find({ take: 20 });
    let logCount = 0;
    for (let i = 0; i < 50; i++) {
      const inventory = inventoryItems[Math.floor(Math.random() * inventoryItems.length)];
      const project = projects[Math.floor(Math.random() * projects.length)];
      const projectPhases = phases.filter((p) => p.project_id === project.id);
      const phase = projectPhases.length > 0 ? projectPhases[Math.floor(Math.random() * projectPhases.length)] : null;
      const user = users[Math.floor(Math.random() * users.length)];
      const usageTypes = [UsageType.USED, UsageType.USED, UsageType.USED, UsageType.RETURNED, UsageType.DAMAGED];
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

  private async seedBOQData(projects: Project[], users: User[]) {
    console.log("\n📋 Seeding BOQ Data and BOQ Phases...");

    const contractors = users.filter(u => u.role === UserRole.CONTRACTOR && u.status === "active");
    const subContractors = users.filter(u => u.role === UserRole.SUB_CONTRACTOR && u.status === "active");
    const consultants = users.filter(u => u.role === UserRole.CONSULTANT && u.status === "active");

    // BOQ item templates for realistic construction project data
    const boqItemTemplates = [
      // Earthworks
      { section: "Earthworks", description: "Excavation for foundation", unit: "m³", rate: 15000, quantity: 100 },
      { section: "Earthworks", description: "Backfilling and compaction", unit: "m³", rate: 12000, quantity: 80 },
      { section: "Earthworks", description: "Site clearing and preparation", unit: "m²", rate: 5000, quantity: 500 },
      
      // Concrete Works
      { section: "Concrete Works", description: "Reinforced concrete for foundation", unit: "m³", rate: 250000, quantity: 50 },
      { section: "Concrete Works", description: "Concrete for columns", unit: "m³", rate: 280000, quantity: 30 },
      { section: "Concrete Works", description: "Concrete for beams", unit: "m³", rate: 270000, quantity: 25 },
      { section: "Concrete Works", description: "Concrete for slabs", unit: "m³", rate: 260000, quantity: 40 },
      
      // Masonry
      { section: "Masonry", description: "Brickwork for walls", unit: "m²", rate: 45000, quantity: 200 },
      { section: "Masonry", description: "Blockwork for partitions", unit: "m²", rate: 40000, quantity: 150 },
      { section: "Masonry", description: "Stone masonry", unit: "m²", rate: 60000, quantity: 100 },
      
      // Steel Works
      { section: "Steel Works", description: "Reinforcement steel bars", unit: "kg", rate: 2500, quantity: 5000 },
      { section: "Steel Works", description: "Structural steel fabrication", unit: "kg", rate: 3500, quantity: 3000 },
      { section: "Steel Works", description: "Steel installation", unit: "kg", rate: 2000, quantity: 8000 },
      
      // Roofing
      { section: "Roofing", description: "Roof trusses", unit: "m²", rate: 35000, quantity: 300 },
      { section: "Roofing", description: "Roofing sheets", unit: "m²", rate: 25000, quantity: 350 },
      { section: "Roofing", description: "Gutters and downpipes", unit: "m", rate: 15000, quantity: 200 },
      
      // Finishes
      { section: "Finishes", description: "Plastering", unit: "m²", rate: 12000, quantity: 800 },
      { section: "Finishes", description: "Painting", unit: "m²", rate: 8000, quantity: 900 },
      { section: "Finishes", description: "Floor tiling", unit: "m²", rate: 30000, quantity: 400 },
      { section: "Finishes", description: "Wall tiling", unit: "m²", rate: 35000, quantity: 200 },
      
      // Electrical
      { section: "Electrical", description: "Electrical wiring", unit: "m", rate: 5000, quantity: 1000 },
      { section: "Electrical", description: "Light fixtures", unit: "no", rate: 50000, quantity: 50 },
      { section: "Electrical", description: "Switchboards", unit: "no", rate: 200000, quantity: 5 },
      
      // Plumbing
      { section: "Plumbing", description: "Water supply pipes", unit: "m", rate: 8000, quantity: 500 },
      { section: "Plumbing", description: "Drainage pipes", unit: "m", rate: 10000, quantity: 400 },
      { section: "Plumbing", description: "Sanitary fixtures", unit: "no", rate: 150000, quantity: 20 },
      
      // Doors and Windows
      { section: "Doors and Windows", description: "Doors", unit: "no", rate: 200000, quantity: 30 },
      { section: "Doors and Windows", description: "Windows", unit: "no", rate: 150000, quantity: 40 },
      { section: "Doors and Windows", description: "Door frames", unit: "no", rate: 80000, quantity: 30 },
      
      // Site Works
      { section: "Site Works", description: "Fencing", unit: "m", rate: 25000, quantity: 200 },
      { section: "Site Works", description: "Landscaping", unit: "m²", rate: 15000, quantity: 500 },
      { section: "Site Works", description: "Road works", unit: "m²", rate: 45000, quantity: 300 },
    ];

    let boqCount = 0;
    let boqPhaseCount = 0;

    // Create BOQ data for 70% of projects (mix of contractor and sub-contractor BOQs)
    const projectsToSeed = projects.slice(0, Math.floor(projects.length * 0.7));

    for (const project of projectsToSeed) {
      // Get financial summary for budget calculation
      const financialSummary = await this.financialSummaryRepository.findOne({
        where: { project_id: project.id },
      });
      const projectBudget = financialSummary?.totalBudget || project.totalAmount || 100000000; // Default 100M TZS

      // Randomly decide if this project gets contractor BOQ, sub-contractor BOQ, or both
      const hasContractorBOQ = Math.random() > 0.3; // 70% chance
      const hasSubContractorBOQ = Math.random() > 0.4; // 60% chance

      const uploader = consultants[Math.floor(Math.random() * consultants.length)] || users[0];

      // Create Contractor BOQ
      if (hasContractorBOQ) {
        const contractorBoqItems = [];
        const numItems = 8 + Math.floor(Math.random() * 12); // 8-20 items
        let totalAmount = 0;

        for (let i = 0; i < numItems; i++) {
          const template = boqItemTemplates[Math.floor(Math.random() * boqItemTemplates.length)];
          const quantity = template.quantity * (0.8 + Math.random() * 0.4); // Vary quantity by ±20%
          const rate = template.rate * (0.9 + Math.random() * 0.2); // Vary rate by ±10%
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

        // Create ProjectBoq entry
        const contractorBoq = this.projectBoqRepository.create({
          project_id: project.id,
          type: BOQType.CONTRACTOR,
          status: BOQStatus.PROCESSED,
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

        // Create phases from BOQ items (these will appear in "View BOQ Phases")
        for (const item of contractorBoqItems) {
          const phaseStartDate = new Date(
            Date.now() - Math.random() * 100 * 24 * 60 * 60 * 1000
          );
          const phaseEndDate = new Date(
            phaseStartDate.getTime() + (30 + Math.random() * 90) * 24 * 60 * 60 * 1000
          );

          // Create phase directly in database with from_boq = true and is_active = false
          const boqPhase = this.phaseRepository.create({
            title: item.description,
            description: `Section: ${item.section} | Unit: ${item.unit} | Quantity: ${item.quantity} | Rate: ${item.rate.toLocaleString('en-US')} TZS`,
            budget: item.amount,
            start_date: phaseStartDate,
            end_date: phaseEndDate,
            due_date: phaseEndDate,
            progress: 0,
            status: PhaseStatus.NOT_STARTED,
            project_id: project.id,
            is_active: false, // 🔒 HIDDEN: These phases appear in "View BOQ Phases" but not in regular phase list
            from_boq: true, // 📋 Mark as BOQ-created
            boqType: "contractor",
            created_at: new Date(),
            updated_at: new Date(),
          });

          await this.phaseRepository.save(boqPhase);
          boqPhaseCount++;
        }
      }

      // Create Sub-Contractor BOQ
      if (hasSubContractorBOQ) {
        const subContractorBoqItems = [];
        const numItems = 5 + Math.floor(Math.random() * 10); // 5-15 items
        let totalAmount = 0;

        for (let i = 0; i < numItems; i++) {
          const template = boqItemTemplates[Math.floor(Math.random() * boqItemTemplates.length)];
          const quantity = template.quantity * (0.5 + Math.random() * 0.3); // Smaller quantities for sub-contractor
          const rate = template.rate * (0.8 + Math.random() * 0.2); // Slightly lower rates
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

        // Create ProjectBoq entry
        const subContractorBoq = this.projectBoqRepository.create({
          project_id: project.id,
          type: BOQType.SUB_CONTRACTOR,
          status: BOQStatus.PROCESSED,
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

        // Get contractor phases for linking (if any exist)
        const contractorPhases = await this.contractorPhaseRepository.find({
          where: { project_id: project.id },
          take: 5, // Get up to 5 contractor phases for potential linking
        });

        // Create phases from BOQ items
        for (const item of subContractorBoqItems) {
          const phaseStartDate = new Date(
            Date.now() - Math.random() * 80 * 24 * 60 * 60 * 1000
          );
          const phaseEndDate = new Date(
            phaseStartDate.getTime() + (20 + Math.random() * 60) * 24 * 60 * 60 * 1000
          );

          // Randomly link to a contractor phase (if available)
          const linkedContractorPhaseId = contractorPhases.length > 0 && Math.random() > 0.5
            ? contractorPhases[Math.floor(Math.random() * contractorPhases.length)].id
            : null;

          // Create phase directly in database with from_boq = true and is_active = false
          const boqPhase = this.phaseRepository.create({
            title: item.description,
            description: `Section: ${item.section} | Unit: ${item.unit} | Quantity: ${item.quantity} | Rate: ${item.rate.toLocaleString('en-US')} TZS`,
            budget: item.amount,
            start_date: phaseStartDate,
            end_date: phaseEndDate,
            due_date: phaseEndDate,
            progress: 0,
            status: PhaseStatus.NOT_STARTED,
            project_id: project.id,
            is_active: false, // 🔒 HIDDEN: These phases appear in "View BOQ Phases" but not in regular phase list
            from_boq: true, // 📋 Mark as BOQ-created
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
}

@Injectable()
export class SeedCommand {
  constructor(private readonly seedService: SeedService) {}

  @Command({
    command: "seed",
    describe:
      "seed the database with comprehensive Tanzanian admin dashboard data",
  })
  async run() {
    await this.seedService.seed();
  }
}
