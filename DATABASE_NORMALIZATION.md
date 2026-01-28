# Database Normalization Summary

This document outlines the database normalization changes made to improve scalability and maintainability.

## Overview

The database has been restructured to separate concerns and prevent data from being cramped into single tables. This improves:
- **Scalability**: Tables can grow independently
- **Performance**: Smaller, focused tables with better indexing
- **Maintainability**: Clear separation of concerns
- **Extensibility**: Easy to add new features without modifying core tables

## New Tables Created

### 1. Project Financial Summary (`project_financial_summaries`)
**Purpose**: Separates financial data from project metadata

**Fields**:
- `total_budget`, `allocated_budget`, `spent_amount`
- `estimated_savings`, `received_amount`, `paid_amount`
- `net_cash_flow`, `financial_status`
- `budget_last_updated`, `last_transaction_date`

**Benefits**: 
- Financial calculations don't bloat the main project table
- Better indexing for financial queries
- Easier to archive historical financial data

### 2. Project Metadata (`project_metadata`)
**Purpose**: Stores extended project information

**Fields**:
- Client information (name, contact, email)
- Professional contacts (architect, engineer, contractor)
- Contract details (number, date)
- Permit information
- Location and coordinates
- Custom fields (JSONB for extensibility)

**Benefits**:
- Keeps main project table lean
- Allows for extensible metadata without schema changes
- Better organization of project-related information

### 3. Project Settings (`project_settings`)
**Purpose**: Stores project-specific configurations

**Fields**:
- Collaboration settings
- Approval thresholds
- Notification preferences
- Currency and language
- Custom settings (JSONB)

**Benefits**:
- Configurable per-project behavior
- Easy to add new settings without schema changes
- Better control over project permissions

### 4. Phase Financial Summary (`phase_financial_summaries`)
**Purpose**: Tracks financial data for phases separately

**Fields**:
- `allocated_budget`, `spent_amount`
- `estimated_cost`, `actual_cost`, `variance`
- `financial_status`

**Benefits**:
- Phase financial tracking independent of phase metadata
- Better financial reporting per phase
- Easier to calculate phase-level budgets

### 5. Supplier (`suppliers`)
**Purpose**: Normalizes supplier information

**Fields**:
- Contact information
- Address and location
- Tax ID, website
- Payment terms (JSONB)
- Rating system

**Benefits**:
- Eliminates duplicate supplier data
- Better supplier management
- Can track supplier performance
- Supports multiple inventory items per supplier

### 6. Transaction Attachment (`transaction_attachments`)
**Purpose**: Supports multiple files per transaction

**Fields**:
- `type` (receipt, invoice, quote, contract, other)
- File information (URL, name, mime type, size)
- Description and uploader

**Benefits**:
- Multiple attachments per transaction (not just one receipt)
- Better document management
- Supports various document types

### 7. Transaction Approval History (`transaction_approval_history`)
**Purpose**: Tracks all approval actions for audit

**Fields**:
- Action type (approved, rejected, pending, requested_changes)
- Actor and comments
- Reason for action

**Benefits**:
- Complete audit trail
- Multiple approval cycles
- Better compliance tracking

### 8. User Preferences (`user_preferences`)
**Purpose**: Separates user preferences from user table

**Fields**:
- Notification preferences (detailed)
- Language, timezone, theme
- Dashboard layout
- Table preferences
- Email/push notification settings

**Benefits**:
- User table stays focused on core identity
- Rich preference management
- Better user experience customization

### 9. User Session (`user_sessions`)
**Purpose**: Tracks active user sessions

**Fields**:
- Token, IP address, user agent
- Device type, browser, OS
- Expiration and activity tracking
- Location

**Benefits**:
- Security monitoring
- Session management
- Analytics and user behavior tracking
- Can revoke sessions

### 10. Audit Log (`audit_logs`)
**Purpose**: Comprehensive system audit trail

**Fields**:
- Action type (create, update, delete, view, etc.)
- Entity type and ID
- Old and new values (JSONB)
- User, IP, user agent
- Success/failure status

**Benefits**:
- Complete system audit trail
- Security and compliance
- Debugging and troubleshooting
- Change tracking

### 11. Inventory Usage Log (`inventory_usage_logs`)
**Purpose**: Detailed inventory movement tracking

**Fields**:
- Usage type (used, returned, damaged, lost, adjustment)
- Quantity and pricing
- Project and phase linkage
- Recorder and date

**Benefits**:
- Complete inventory history
- Better inventory tracking
- Cost analysis per project/phase
- Audit trail for inventory movements

## Updated Entities

### Project Entity
**Removed Fields**:
- `total_budget`, `allocated_budget`, `spent_amount`
- `estimated_savings`, `budget_last_updated`, `financial_status`

**Added Relations**:
- `financialSummary` → `ProjectFinancialSummary`
- `metadata` → `ProjectMetadata`
- `settings` → `ProjectSettings`

### User Entity
**Removed Fields**:
- `notification_preferences` (JSONB)

**Added Relations**:
- `preferences` → `UserPreferences`
- `sessions` → `UserSession[]`

### Inventory Entity
**Removed Fields**:
- `supplier` (string)
- `supplier_contact` (string)

**Added Relations**:
- `supplier` → `Supplier` (foreign key)
- `usageLogs` → `InventoryUsageLog[]`

### ProjectTransaction Entity
**Removed Fields**:
- `receipt_url` (single file)

**Added Relations**:
- `attachments` → `TransactionAttachment[]` (multiple files)
- `approvalHistory` → `TransactionApprovalHistory[]`

### Phase Entity
**Added Relations**:
- `financialSummary` → `PhaseFinancialSummary`

## Migration Strategy

### For Existing Data

1. **Project Financial Data**: Migrate existing financial fields from `projects` to `project_financial_summaries`
2. **User Preferences**: Create `user_preferences` records from existing `notification_preferences` JSONB
3. **Inventory Suppliers**: Extract unique suppliers and create `suppliers` table, then link inventory items
4. **Transaction Attachments**: Migrate `receipt_url` to `transaction_attachments` table
5. **Approval History**: Create initial approval history records from existing approval data

### Database Migration Script

A migration script should be created to:
1. Create all new tables
2. Migrate existing data
3. Update foreign key relationships
4. Remove old columns (after verification)

## Benefits Summary

1. **Scalability**: Each table can grow independently without affecting others
2. **Performance**: Smaller tables with focused indexes perform better
3. **Maintainability**: Clear separation makes code easier to understand
4. **Extensibility**: JSONB fields allow schema evolution without migrations
5. **Audit Trail**: Comprehensive logging for security and compliance
6. **Data Integrity**: Normalized structure reduces data duplication
7. **Query Optimization**: Focused queries on smaller tables are faster

## Next Steps

1. Create database migration scripts
2. Update services to use new normalized tables
3. Update controllers and DTOs
4. Update frontend to handle new data structure
5. Add indexes for performance
6. Create views for common queries if needed

## Indexes Recommended

- `project_financial_summaries.project_id` (unique)
- `user_sessions.user_id, is_active`
- `user_sessions.token` (unique)
- `audit_logs.entity_type, entity_id`
- `audit_logs.user_id, created_at`
- `inventory_usage_logs.inventory_id, created_at`
- `transaction_attachments.transaction_id`
- `transaction_approval_history.transaction_id`
