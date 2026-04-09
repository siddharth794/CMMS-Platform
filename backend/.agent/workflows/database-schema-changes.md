---
description: Mandatory migration-first workflow for any database schema changes in the CMMS backend
---
# Database Schema Change Workflow

## CRITICAL: Never use `sequelize.sync()`

**`sequelize.sync()`, `Model.sync()`, and `sequelize.sync({ alter: true })` are BANNED.** They bypass migration history and cause schema drift. This project has had production failures from this practice.

## For EVERY database schema change, follow these steps in exact order:

### Step 1: Generate migration
```bash
npx sequelize-cli migration:generate --name descriptive-name
```
// turbo

### Step 2: Write the migration
Edit the generated file in `src/migrations/`. Write BOTH `up` (apply) and `down` (revert) logic.

- New table → `queryInterface.createTable` / `queryInterface.dropTable`
- New column → `queryInterface.addColumn` / `queryInterface.removeColumn`
- Change column → `queryInterface.changeColumn` (reverse in `down`)
- New index → `queryInterface.addIndex` / `queryInterface.removeIndex`
- ENUM changes → `queryInterface.sequelize.query()` with raw ALTER SQL
- Multi-table changes → wrap in `queryInterface.sequelize.transaction()`

### Step 3: Update model in `src/models/index.ts`
Add/modify the model class and `Model.init()` to match the migration exactly. Add associations at the bottom of the file. Export the new model.

### Step 4: Update seed script
If the new table or column benefits from demo data, update `src/scripts/seed-all.ts`.

### Step 5: Run migration
```bash
npm run migrate
```
// turbo

## This workflow applies to ALL schema changes including:
- Creating new tables
- Adding, removing, or renaming columns
- Changing column types or constraints
- Adding or removing indexes / unique constraints
- Adding or removing foreign key constraints
- Modifying ENUM values
- Creating junction tables for many-to-many relationships

## Quick setup for fresh databases
```bash
npm run setup   # runs migrate + seed:all
```
// turbo
