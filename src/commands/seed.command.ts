import { Command } from "nestjs-command";
import { Injectable } from "@nestjs/common";
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
import * as bcrypt from "bcrypt";

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
    private readonly inventoryRepository: Repository<Inventory>
  ) {}

  async seed() {
    console.log(
      "🌱 Starting comprehensive Tanzanian admin dashboard seeding..."
    );

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

    console.log("✅ Comprehensive Tanzanian admin dashboard seeding complete!");
  }

  private async seedDepartments() {
    console.log("📂 Seeding Tanzanian departments...");
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
        console.log(`   ✓ Created department: ${deptData.name}`);
      }
      departments.push(dept);
    }
    return departments;
  }

  private async seedUsers(departments: Department[]) {
    console.log("👥 Seeding Tanzanian users...");

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
          notification_preferences: {
            email: true,
            project_updates: true,
            task_updates: true,
          },
          last_login:
            userData.status === "active"
              ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
              : null,
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
    console.log("👑 Seeding admin users...");
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
        console.log(`   ✓ Created admin: ${adminData.display_name}`);
      }
      admins.push(admin);
    }
    return admins;
  }

  private async seedProjects(users: User[], departments: Department[]) {
    console.log("🏗️  Seeding Tanzanian projects with realistic budgets...");

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

    const projects = [];
    for (let i = 0; i < tanzanianProjects.length; i++) {
      const projectData = tanzanianProjects[i];
      const owner =
        users[i % users.filter((u) => u.status === "active").length];

      let project = await this.projectRepository.findOne({
        where: { title: projectData.title },
      });

      if (!project) {
        // Calculate realistic spent amounts and savings based on status
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

        project = this.projectRepository.create({
          title: projectData.title,
          description: projectData.description,
          status: projectData.status,
          priority: projectData.priority,
          owner_id: owner.id,
          department_id: projectData.department.id,
          totalBudget: projectData.totalBudget,
          totalAmount: projectData.totalBudget, // For backward compatibility
          spentAmount,
          estimatedSavings,
          financialStatus,
          budgetLastUpdated: new Date(),
          tags: projectData.tags,
          start_date: new Date(
            Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
          ), // Random start within last year
          end_date: new Date(
            Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000
          ), // Random end within next year
        });

        await this.projectRepository.save(project);

        // Add collaborators (2-4 random users per project)
        const collaboratorCount = 2 + Math.floor(Math.random() * 3);
        const availableUsers = users.filter(
          (u) => u.id !== owner.id && u.status === "active"
        );
        const selectedCollaborators = availableUsers
          .sort(() => 0.5 - Math.random())
          .slice(0, collaboratorCount);

        project.collaborators = selectedCollaborators;
        await this.projectRepository.save(project);

        console.log(
          `   ✓ Created project: ${project.title} (Budget: TSh ${(projectData.totalBudget / 1000000000).toFixed(1)}B)`
        );
      }
      projects.push(project);
    }
    return projects;
  }

  private async seedPhases(projects: Project[], users: User[]) {
    console.log("📋 Seeding project phases...");

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

    const phases = [];
    for (const project of projects) {
      const numPhases = 3 + Math.floor(Math.random() * 4); // 3-6 phases per project
      let cumulativeBudget = 0;

      for (let i = 0; i < numPhases; i++) {
        const phaseTemplate = phaseTemplates[i % phaseTemplates.length];
        const phaseBudget = project.totalBudget / numPhases;
        cumulativeBudget += phaseBudget;

        let status = PhaseStatus.NOT_STARTED;
        let progress = 0;

        // Set realistic phase status based on project status
        if (project.status === ProjectStatus.COMPLETED) {
          status = PhaseStatus.COMPLETED;
          progress = 100;
        } else if (project.status === ProjectStatus.IN_PROGRESS) {
          if (i < numPhases / 2) {
            status = PhaseStatus.COMPLETED;
            progress = 100;
          } else if (i === Math.floor(numPhases / 2)) {
            status = PhaseStatus.IN_PROGRESS;
            progress = 20 + Math.random() * 60; // 20-80% progress
          }
        } else if (project.status === ProjectStatus.PLANNING && i === 0) {
          status = PhaseStatus.IN_PROGRESS;
          progress = 30 + Math.random() * 40; // 30-70% progress
        }

        const phase = this.phaseRepository.create({
          title: `${phaseTemplate.title} - ${project.title.split(" ").slice(0, 3).join(" ")}`,
          description: phaseTemplate.description,
          project_id: project.id,
          budget: phaseBudget,
          progress,
          status,
          start_date: new Date(
            Date.now() - Math.random() * 200 * 24 * 60 * 60 * 1000
          ),
          end_date: new Date(
            Date.now() + Math.random() * 300 * 24 * 60 * 60 * 1000
          ),
          due_date: new Date(
            Date.now() + Math.random() * 250 * 24 * 60 * 60 * 1000
          ),
        });

        await this.phaseRepository.save(phase);
        phases.push(phase);

        // Create sub-phases for this phase
        await this.seedSubPhasesForPhase(phase, status);
      }
    }

    console.log(`   ✓ Created ${phases.length} phases with sub-phases`);
    return phases;
  }

  private async seedSubPhasesForPhase(phase: Phase, phaseStatus: PhaseStatus) {
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

    // Find matching template based on phase title or description
    // Phase title format is: "Template Title - Project Name", so we check if title contains the key
    let subPhasesToCreate: Array<{ title: string; description?: string }> = [];
    for (const [key, templates] of Object.entries(subPhaseTemplates)) {
      if (phase.title.includes(key) || phase.description?.includes(key)) {
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
      const progressRatio = (phase.progress || 0) / 100;
      completedCount = Math.floor(subPhasesToCreate.length * progressRatio);
    }

    // Create sub-phases
    for (let i = 0; i < subPhasesToCreate.length; i++) {
      const template = subPhasesToCreate[i];
      const isCompleted = i < completedCount;

      const subPhase = this.subPhaseRepository.create({
        title: template.title,
        description: template.description,
        phase_id: phase.id,
        isCompleted,
      });

      await this.subPhaseRepository.save(subPhase);
    }
  }

  private async seedTasks(projects: Project[], phases: Phase[], users: User[]) {
    console.log("✅ Seeding tasks...");

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

        const task = this.taskRepository.create({
          description: `${template.description} - ${phase.title}`,
          unit: template.unit,
          quantity: Math.round(quantity * 100) / 100,
          price: template.price,
          project_id: phase.project_id,
          phase_id: phase.id,
        });

        await this.taskRepository.save(task);
        tasks.push(task);
      }
    }

    console.log(`   ✓ Created ${tasks.length} tasks`);
    return tasks;
  }

  private async seedFinancialData(projects: Project[], users: User[]) {
    console.log("💰 Seeding comprehensive financial data...");

    // Track all used transaction numbers across all projects to ensure global uniqueness
    const globalUsedTransactionNumbers = new Set<string>();

    for (const project of projects) {
      console.log(`   📊 Seeding finance for project: ${project.title}`);
      
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
        const budgetedAmount =
          project.totalBudget * categoryData.budgetPercentage;
        
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
      
      await this.projectRepository.update(project.id, {
        allocatedBudget: normalizedAllocated,
      });

      // Create savings records
      await this.createSavingsRecords(project, users[0]);

      // Create budget alerts if needed
      await this.createBudgetAlerts(project);
    }

    console.log("   ✅ Financial data seeding complete!");
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
        console.warn(`⚠️ [Seed] Transaction ${t.id} has mismatched projectId. Expected: ${projectId}, Found: ${t.projectId}`);
        return false; // Skip this transaction to prevent cross-project contamination
      }
      return true;
    });

    const totalSpent = validTransactions.reduce((sum, t) => {
      return sum + extractTransactionAmount(t);
    }, 0);

    const normalizedSpent = Math.max(0, totalSpent);
    await this.projectRepository.update(projectId, {
      spentAmount: normalizedSpent,
    });
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
    if (project.estimatedSavings <= 0) return;

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
    // Ensure values are numbers before calculation
    const totalBudget = typeof project.totalBudget === 'number' 
      ? project.totalBudget 
      : parseFloat(String(project.totalBudget || 0)) || 0;
    const spentAmount = typeof project.spentAmount === 'number' 
      ? project.spentAmount 
      : parseFloat(String(project.spentAmount || 0)) || 0;

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
    console.log("📊 Seeding activities (audit log)...");

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

    console.log(`   ✓ Created ${activities.length} activities`);
    return activities;
  }

  private async seedReports(users: User[]) {
    console.log("📄 Seeding reports...");

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

    console.log("   ✓ Created reports");
  }

  private async seedComments(
    users: User[],
    projects: Project[],
    tasks: Task[]
  ) {
    console.log("💬 Seeding comments...");

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

    console.log("   ✓ Created comments");
  }

  private async seedComplaints(
    users: User[],
    projects: Project[],
    phases: Phase[]
  ) {
    console.log("📢 Seeding complaints...");

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

    console.log("   ✓ Created complaints");
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
    console.log("📦 Seeding inventory items...");

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
      const inventory = this.inventoryRepository.create({
        ...itemData,
        created_by: randomUser.id,
        picture_url: `https://via.placeholder.com/400x300?text=${encodeURIComponent(itemData.name)}`,
        tags: itemData.category ? [itemData.category.toString()] : [],
      });

      const saved = await this.inventoryRepository.save(inventory);
      createdItems.push(saved);
    }

    console.log(`✅ Created ${createdItems.length} inventory items`);
    return createdItems;
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
