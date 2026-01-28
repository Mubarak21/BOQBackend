# Database Transaction Implementation Guide

This document outlines where database transactions should be implemented to ensure data integrity and consistency across the application.

## Why Transactions Are Needed

Transactions ensure that multiple database operations either all succeed or all fail together, preventing partial updates that could leave the database in an inconsistent state.

## Critical Areas Requiring Transactions

### ✅ 1. **Phase Creation** (`ProjectPhaseService.createPhase`) - IMPLEMENTED

**Location**: `BOQBackend/src/projects/services/project-phase.service.ts`

**Why**: Creates phase, tasks, sub-phases, and activity logs. If any step fails, we need to rollback all changes.

**Operations**:
- Create phase in appropriate table (contractor_phases, sub_contractor_phases, or phase)
- Create/update tasks
- Create sub-phases (if provided)
- Log activity

**Implementation**:
```typescript
async createPhase(
  projectId: string,
  createPhaseDto: CreatePhaseDto,
  userId: string
): Promise<Phase> {
  // Use queryRunner for transaction management
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // ... validation code ...

    // Create phase
    let savedPhase: any;
    if (userRole === 'contractor') {
      const contractorPhase = this.contractorPhasesRepository.create({...});
      savedPhase = await queryRunner.manager.save(ContractorPhase, contractorPhase);
    } else if (userRole === 'sub_contractor') {
      const subContractorPhase = this.subContractorPhasesRepository.create({...});
      savedPhase = await queryRunner.manager.save(SubContractorPhase, subContractorPhase);
    } else {
      const phase = this.phasesRepository.create({...});
      savedPhase = await queryRunner.manager.save(Phase, phase);
    }

    // Create tasks within transaction
    if (createPhaseDto.tasks?.length) {
      for (const taskDto of createPhaseDto.tasks) {
        // ... create/update tasks using queryRunner.manager ...
      }
    }

    // Log activity (can be outside transaction if activity logging failures shouldn't rollback)
    await this.activitiesService.createActivity(...);

    await queryRunner.commitTransaction();
    return this.normalizePhaseResponse(savedPhase);
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}
```

---

### ✅ 2. **BOQ Phase Activation** (`ProjectPhaseService.activateBoqPhases`) - IMPLEMENTED

**Location**: `BOQBackend/src/projects/services/project-phase.service.ts`

**Why**: Activates multiple phases across different tables. All phases should be activated atomically.

**Operations**:
- Update multiple phases (contractor_phases, sub_contractor_phases, phase tables)
- Log activities for each phase

**Implementation**:
```typescript
async activateBoqPhases(
  projectId: string,
  phaseIds: string[],
  userId: string
): Promise<{ activated: number; phases: any[] }> {
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const activatedPhases: any[] = [];

    for (const phaseId of phaseIds) {
      // Try contractor phases
      const contractorPhase = await queryRunner.manager.findOne(ContractorPhase, {
        where: { id: phaseId, project_id: projectId, from_boq: true }
      });
      
      if (contractorPhase) {
        contractorPhase.is_active = true;
        await queryRunner.manager.save(ContractorPhase, contractorPhase);
        activatedPhases.push(contractorPhase);
        continue;
      }

      // Try sub-contractor phases
      const subContractorPhase = await queryRunner.manager.findOne(SubContractorPhase, {
        where: { id: phaseId, project_id: projectId, from_boq: true }
      });
      
      if (subContractorPhase) {
        subContractorPhase.is_active = true;
        await queryRunner.manager.save(SubContractorPhase, subContractorPhase);
        activatedPhases.push(subContractorPhase);
        continue;
      }

      // Try legacy Phase table
      const legacyPhase = await queryRunner.manager.findOne(Phase, {
        where: { id: phaseId, project_id: projectId, from_boq: true }
      });
      
      if (legacyPhase) {
        legacyPhase.is_active = true;
        await queryRunner.manager.save(Phase, legacyPhase);
        activatedPhases.push(legacyPhase);
      }
    }

    // Log activities (can be outside transaction)
    // ... activity logging ...

    await queryRunner.commitTransaction();
    return { activated: activatedPhases.length, phases: activatedPhases };
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}
```

---

### ✅ 3. **BOQ Processing** (`ProjectPhaseService.createPhasesFromBoqData`) - IMPLEMENTED

**Location**: `BOQBackend/src/projects/services/project-phase.service.ts`

**Why**: Creates multiple phases from BOQ data. All phases should be created atomically.

**Operations**:
- Create multiple phases in a loop
- All phases must be created or none

**Implementation**:
```typescript
async createPhasesFromBoqData(
  data: any[],
  projectId: string,
  userId: string,
  boqType?: 'contractor' | 'sub_contractor'
): Promise<ContractorPhase[] | SubContractorPhase[]> {
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    if (boqType === 'sub_contractor') {
      const subContractorPhases: SubContractorPhase[] = [];
      
      for (const row of data) {
        // ... extract data ...
        const phaseData = { ... };
        const phase = queryRunner.manager.create(SubContractorPhase, phaseData);
        const savedPhase = await queryRunner.manager.save(SubContractorPhase, phase);
        subContractorPhases.push(savedPhase);
      }

      await queryRunner.commitTransaction();
      return subContractorPhases;
    } else {
      const contractorPhases: ContractorPhase[] = [];
      
      for (const row of data) {
        // ... extract data ...
        const phaseData = { ... };
        const phase = queryRunner.manager.create(ContractorPhase, phaseData);
        const savedPhase = await queryRunner.manager.save(ContractorPhase, phase);
        contractorPhases.push(savedPhase);
      }

      await queryRunner.commitTransaction();
      return contractorPhases;
    }
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}
```

---

### ✅ 4. **BOQ File Processing** (`ProjectBoqService.processBoqFileFromParsedData`) - IMPLEMENTED

**Status**: ✅ IMPLEMENTED - Uses QueryRunner to ensure atomic BOQ record creation, phase creation, and project updates. File operations are handled outside transaction with cleanup on rollback.

**Location**: `BOQBackend/src/projects/services/project-boq.service.ts`

**Why**: Creates BOQ record and multiple phases. If phase creation fails, BOQ record should be rolled back.

**Operations**:
- Save BOQ record
- Create multiple phases via `createPhasesFromBoqData`
- Update BOQ status

**Implementation**:
```typescript
async processBoqFileFromParsedData(
  projectId: string,
  data: any[],
  totalAmount: number,
  userId: string,
  fileName?: string,
  file?: Express.Multer.File,
  type?: 'contractor' | 'sub_contractor'
): Promise<ProcessBoqResult> {
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // ... validation and file handling ...

    // Create or update BOQ record
    let boqRecord: ProjectBoq;
    if (existingBoq) {
      boqRecord = existingBoq;
      boqRecord.status = BOQStatus.PROCESSING;
      // ... update fields ...
    } else {
      boqRecord = queryRunner.manager.create(ProjectBoq, {
        project_id: projectId,
        type: boqType,
        status: BOQStatus.PROCESSING,
        // ... other fields ...
      });
    }
    await queryRunner.manager.save(ProjectBoq, boqRecord);

    // Create phases (this should also use transaction internally)
    const createdPhases = await this.projectPhaseService.createPhasesFromBoqData(
      dataWithUnits,
      projectId,
      userId,
      boqTypeString
    );

    // Update BOQ status to PROCESSED
    boqRecord.status = BOQStatus.PROCESSED;
    await queryRunner.manager.save(ProjectBoq, boqRecord);

    await queryRunner.commitTransaction();
    return { ... };
  } catch (error) {
    await queryRunner.rollbackTransaction();
    // Clean up file if created
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw error;
  } finally {
    await queryRunner.release();
  }
}
```

---

### ✅ 5. **Phase Update with Synchronization** (`ProjectPhaseService.updatePhase`) - IMPLEMENTED

**Location**: `BOQBackend/src/projects/services/project-phase.service.ts`

**Why**: Updates phase and syncs changes to linked phases (contractor ↔ sub-contractor). All updates must be atomic to ensure data consistency.

**Operations**:
- Update phase in appropriate table
- Sync changes to linked phases (status, progress, dates)
- All updates must succeed or all must fail

**Status**: ✅ IMPLEMENTED - Uses QueryRunner to ensure atomic updates and synchronization.

---

### ✅ 5. **Financial Transaction Creation** (`TransactionService.createTransaction`) - IMPLEMENTED

**Status**: ✅ IMPLEMENTED - Uses QueryRunner to ensure atomic transaction creation, category spent amount updates, project spent amount updates, and budget alert creation.

**Location**: `BOQBackend/src/finance/services/transaction.service.ts`

**Why**: Creates transaction, updates budget categories, updates project financial summary, and creates alerts.

**Operations**:
- Create transaction
- Update category spent amount
- Update project spent amount
- Update project financial summary
- Check and create budget alerts

**Implementation**:
```typescript
async createTransaction(
  createTransactionDto: CreateTransactionDto,
  userId: string
): Promise<ProjectTransaction> {
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // Create transaction
    const transaction = queryRunner.manager.create(ProjectTransaction, {
      ...createTransactionDto,
      createdBy: userId,
    });
    const savedTransaction = await queryRunner.manager.save(ProjectTransaction, transaction);

    // Update category spent amount
    if (transaction.categoryId) {
      await this.updateCategorySpentAmountInTransaction(
        transaction.categoryId,
        queryRunner
      );
    }

    // Update project spent amount
    if (transaction.projectId) {
      await this.updateProjectSpentAmountInTransaction(
        transaction.projectId,
        queryRunner
      );
    }

    // Check and create budget alerts
    if (transaction.projectId) {
      await this.checkAndCreateBudgetAlertsInTransaction(
        transaction.projectId,
        queryRunner
      );
    }

    await queryRunner.commitTransaction();
    return savedTransaction;
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}

// Helper methods that use the same transaction
private async updateCategorySpentAmountInTransaction(
  categoryId: string,
  queryRunner: QueryRunner
) {
  // Calculate and update using queryRunner.manager
}

private async updateProjectSpentAmountInTransaction(
  projectId: string,
  queryRunner: QueryRunner
) {
  // Calculate and update using queryRunner.manager
}
```

---

### ✅ 6. **Financial Transaction Update** (`TransactionService.updateTransaction`) - IMPLEMENTED

**Status**: ✅ IMPLEMENTED - Uses QueryRunner to ensure atomic transaction updates and recalculation of spent amounts for both old and new categories/projects.

**Location**: `BOQBackend/src/finance/services/transaction.service.ts`

**Why**: Updates transaction and recalculates budgets for both old and new categories/projects.

**Operations**:
- Update transaction
- Update old category spent amount (if category changed)
- Update new category spent amount (if category changed)
- Update old project spent amount (if project changed)
- Update new project spent amount (if project changed)
- Check and create budget alerts

**Implementation**:
```typescript
async updateTransaction(
  transactionId: string,
  updateTransactionDto: UpdateTransactionDto,
  userId: string
) {
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // Load transaction
    const transaction = await queryRunner.manager.findOne(ProjectTransaction, {
      where: { id: transactionId }
    });

    if (!transaction) {
      throw new NotFoundException("Transaction not found");
    }

    // Store old values
    const oldCategoryId = transaction.categoryId;
    const oldProjectId = transaction.projectId;
    const oldAmount = transaction.amount;

    // Update transaction
    // ... update fields ...
    const updatedTransaction = await queryRunner.manager.save(ProjectTransaction, transaction);

    // Update old category if changed
    if (oldCategoryId && transaction.categoryId !== oldCategoryId) {
      await this.updateCategorySpentAmountInTransaction(oldCategoryId, queryRunner);
    }

    // Update new category if changed
    if (transaction.categoryId && transaction.categoryId !== oldCategoryId) {
      await this.updateCategorySpentAmountInTransaction(transaction.categoryId, queryRunner);
    }

    // Update old project if changed
    if (oldProjectId && transaction.projectId !== oldProjectId) {
      await this.updateProjectSpentAmountInTransaction(oldProjectId, queryRunner);
    }

    // Update new project if changed or amount changed
    if (transaction.projectId) {
      if (transaction.projectId !== oldProjectId || transaction.amount !== oldAmount) {
        await this.updateProjectSpentAmountInTransaction(transaction.projectId, queryRunner);
      }
      await this.checkAndCreateBudgetAlertsInTransaction(transaction.projectId, queryRunner);
    }

    await queryRunner.commitTransaction();
    return updatedTransaction;
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}
```

---

### ✅ 7. **Project Creation** (`ProjectsService.create`) - IMPLEMENTED

**Status**: ✅ IMPLEMENTED - Uses QueryRunner to ensure atomic project creation along with ProjectFinancialSummary, ProjectMetadata, and ProjectSettings.

**Location**: `BOQBackend/src/projects/projects.service.ts`

**Why**: Creates project with financial summary, metadata, and settings. All should be created atomically.

**Operations**:
- Create project
- Create ProjectFinancialSummary
- Create ProjectMetadata
- Create ProjectSettings

**Implementation**:
```typescript
async create(createProjectDto: CreateProjectDto, userId: string): Promise<Project> {
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // Create project
    const project = queryRunner.manager.create(Project, {
      ...createProjectDto,
      owner_id: userId,
    });
    const savedProject = await queryRunner.manager.save(Project, project);

    // Create financial summary
    const financialSummary = queryRunner.manager.create(ProjectFinancialSummary, {
      project_id: savedProject.id,
      totalBudget: createProjectDto.totalAmount || 0,
      spentAmount: 0,
      allocatedBudget: 0,
      estimatedSavings: 0,
      financialStatus: 'on_track',
    });
    await queryRunner.manager.save(ProjectFinancialSummary, financialSummary);

    // Create metadata
    const metadata = queryRunner.manager.create(ProjectMetadata, {
      project_id: savedProject.id,
      // ... metadata fields ...
    });
    await queryRunner.manager.save(ProjectMetadata, metadata);

    // Create settings
    const settings = queryRunner.manager.create(ProjectSettings, {
      project_id: savedProject.id,
      // ... settings fields ...
    });
    await queryRunner.manager.save(ProjectSettings, settings);

    await queryRunner.commitTransaction();
    return savedProject;
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}
```

---

### ✅ 8. **Budget Updates** (`BudgetManagementService.updateProjectBudget`) - IMPLEMENTED

**Status**: ✅ IMPLEMENTED - Uses QueryRunner to ensure atomic budget updates, category budget updates, allocated budget recalculation, and financial status updates.

**Location**: `BOQBackend/src/finance/services/budget-management.service.ts`

**Why**: Updates project budget, category budgets, and financial summary. All updates should be atomic.

**Operations**:
- Update ProjectFinancialSummary
- Update/create BudgetCategory records
- Recalculate allocated budget

**Implementation**:
```typescript
async updateProjectBudget(
  projectId: string,
  updateBudgetDto: UpdateProjectBudgetDto
) {
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // Update financial summary
    const financialSummary = await queryRunner.manager.findOne(ProjectFinancialSummary, {
      where: { project_id: projectId }
    });
    
    if (financialSummary) {
      financialSummary.totalBudget = updateBudgetDto.totalBudget;
      await queryRunner.manager.save(ProjectFinancialSummary, financialSummary);
    }

    // Update categories
    if (updateBudgetDto.categories) {
      for (const categoryDto of updateBudgetDto.categories) {
        let category = await queryRunner.manager.findOne(BudgetCategory, {
          where: { id: categoryDto.id }
        });
        
        if (category) {
          category.budgetedAmount = categoryDto.budgetedAmount;
          await queryRunner.manager.save(BudgetCategory, category);
        } else {
          category = queryRunner.manager.create(BudgetCategory, {
            projectId,
            ...categoryDto,
          });
          await queryRunner.manager.save(BudgetCategory, category);
        }
      }
    }

    // Recalculate allocated budget
    await this.updateProjectAllocatedBudgetInTransaction(projectId, queryRunner);

    await queryRunner.commitTransaction();
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}
```

---

## Setup Required

To use transactions, you need to inject `DataSource` into your services:

```typescript
import { DataSource } from 'typeorm';

@Injectable()
export class YourService {
  constructor(
    private readonly dataSource: DataSource,
    // ... other dependencies ...
  ) {}
}
```

---

## Best Practices

1. **Keep transactions short**: Don't include long-running operations (file I/O, external API calls) inside transactions.

2. **Activity logging**: Consider logging activities outside transactions, as activity log failures shouldn't rollback critical business operations.

3. **Error handling**: Always use try-catch-finally blocks with proper rollback and cleanup.

4. **Nested transactions**: TypeORM doesn't support true nested transactions. If you need to call another transactional method, pass the `QueryRunner` as a parameter.

5. **File operations**: File operations should be done outside transactions. If transaction fails, clean up files manually.

6. **Read operations**: Read operations don't need transactions unless you need consistent reads (use `READ COMMITTED` isolation level).

---

## Priority Implementation Order

1. **High Priority** (Implement First):
   - Financial transaction creation/update
   - BOQ processing and phase creation
   - Project creation

2. **Medium Priority**:
   - Phase activation
   - Budget updates

3. **Low Priority** (Can be deferred):
   - Single phase creation (if no tasks/sub-phases)
   - Read operations

---

## Testing Transactions

When testing, ensure:
1. Transaction rollback works correctly on errors
2. Partial failures don't leave database in inconsistent state
3. Concurrent transactions don't cause deadlocks
4. File cleanup happens on rollback
