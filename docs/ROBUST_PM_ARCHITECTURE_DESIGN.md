# Robust Preventive Maintenance (PM) System Architecture

This document outlines a modern, enterprise-grade architecture for the CMMS Preventive Maintenance workflow. By decoupling the "When", the "What", and the "Execution", we create a highly flexible system capable of handling complex, real-world maintenance scenarios.

---

## 1. The Paradigm Shift: Removing `next_due`

In legacy systems, a PM schedule has a hardcoded `next_due` date. This is inherently flawed because:
1. It only supports basic time intervals (e.g., "add 30 days").
2. It breaks when maintenance is based on usage (e.g., "every 10,000 miles" or "every 500 hours of run time").
3. It doesn't handle **Fixed vs. Floating** schedules well. (If a monthly PM is completed 2 weeks late, is the next one due in 2 weeks or 4 weeks?).

**The Solution:** Remove `next_due` entirely from the database schema. Instead, the system calculates due dates dynamically in real-time or via a background worker by combining a **Rule (Cron/RRULE/Meter Interval)** with a **Reference Point (Last Completed Date / Last Meter Reading)**.

---

## 2. Redesigned Database Schema (The 3-Pillar Model)

A robust PM system is split into three core pillars: Metadata, Triggers, and Templates.

### Pillar 1: The Schedule (Metadata)
The core container for the PM policy.
* **`pm_schedules`**
  * `id` (UUID)
  * `asset_id` (UUID)
  * `name` (String) - e.g., "Quarterly HVAC Inspection"
  * `schedule_logic` (Enum: `FIXED`, `FLOATING`) 
    * *FIXED: Strictly calendar based (e.g., 1st of every month, regardless of delays).*
    * *FLOATING: Based on the completion date of the previous PM (e.g., 30 days after the last time it was actually done).*
  * `is_paused` (Boolean) - For seasonal shutdowns.

### Pillar 2: The Triggers (The "When")
A PM can have multiple triggers (e.g., "Change oil every 6 months OR every 10,000 miles, whichever comes first").
* **`pm_triggers`**
  * `id` (UUID)
  * `pm_schedule_id` (UUID)
  * `trigger_type` (Enum: `TIME`, `METER`, `ALARM`)
  * `cron_expression` (String) - e.g., `0 0 1 */3 *` (Every 3 months) for TIME triggers.
  * `meter_interval` (Integer) - e.g., `500` (hours) for METER triggers.
  * `lead_time_days` (Integer) - Generate the Work Order X days *before* it's actually due so technicians have time to prepare.

### Pillar 3: The Template (The "What")
Defines exactly what the generated Work Order will look like.
* **`pm_templates`** (1-to-1 with `pm_schedules`)
  * `priority` (Enum: low, medium, high)
  * `estimated_hours` (Integer)
  * `assigned_role_id` / `assigned_group_id` - Auto-route the WO to the "Electrical Team".
* **`pm_tasks`** (1-to-Many)
  * `description` - Step-by-step checklist (1. Lock out power, 2. Inspect belt).
* **`pm_parts`** (1-to-Many)
  * `inventory_item_id` (UUID)
  * `quantity_required` (Integer) - Auto-reserves inventory.

### The Tracking Link
* **`pm_executions`** (Logs the history)
  * `pm_schedule_id`
  * `work_order_id`
  * `triggered_by` (Time or Meter)
  * `status` (Generated, Completed, Skipped)
  * `actual_completion_date` (Used as the reference point for FLOATING schedules).

---

## 3. The Generation Engine (Background Worker)

To handle this architecture, you need a decoupled Background Worker (using a robust queue like **BullMQ** with Redis, or **Agenda.js**).

### The Daily/Hourly Evaluation Loop
1. **Fetch Active PMs**: The worker fetches all active `pm_schedules` and their `pm_triggers`.
2. **Evaluate Meters**: 
   * If a trigger is `METER`, check the Asset's current meter reading. 
   * Formula: `If (Current Reading >= Last PM Reading + Meter Interval) -> Generate WO`.
3. **Evaluate Time**:
   * Use a library like `cron-parser` or `rrule.js`.
   * Ask the library: *"Based on the `cron_expression` and the Reference Date (either a fixed calendar start date, or the `actual_completion_date` of the last WO), does the next occurrence fall between NOW and (NOW + `lead_time_days`)?"*
   * If YES -> Generate WO.
4. **Duplicate Prevention (Shadowing)**:
   * Before generating, check the `pm_executions` table. If there is already an active/open Work Order for this PM Schedule, **do not** generate a duplicate. (You don't want 5 open "Monthly Inspections" for the same asset).

### Work Order Assembly Process
When a trigger fires:
1. Create a new `WorkOrder`.
2. Copy `pm_templates.priority`, `assigned_group_id`, etc.
3. Calculate the actual WO `due_date` (Trigger Date + allowed execution window).
4. Copy `pm_tasks` into `work_order_tasks`.
5. Copy `pm_parts` into `work_order_inventory_requirements` (to alert purchasing if stock is low).
6. Record the link in `pm_executions`.

---

## 4. Advanced System Capabilities Unlocked

By adopting this architecture, you gain the following enterprise CMMS features automatically:

* **Predictive Forecasting**: Because you use standardized Cron/RRULEs and average daily meter usage, you can generate a "Forecast View" in the UI showing all PMs due for the next 12 months without saving them to the database.
* **"Whichever Comes First" Logic**: By allowing multiple triggers per PM (e.g., 6 Months OR 500 Hours), the engine simply fires when the *first* trigger condition is met, resets the reference point, and resets all triggers.
* **Compliance Tracking**: You can easily query `pm_executions` to show auditors exactly when a PM was triggered, when the WO was completed, and if it was completed on time relative to the calculated due date.
* **Seasonality**: Adding an `active_months` array (e.g., `[5,6,7,8]` for Summer) to the `pm_schedule` allows the worker to gracefully skip checking snowplows in July.

## 5. Technology Stack Recommendations

* **Database**: PostgreSQL (Relational integrity is crucial for templates, parts, and assets).
* **Queue / Workers**: **BullMQ** (runs on Redis). It is extremely fast, supports complex repeat jobs, and handles worker concurrency flawlessly.
* **Time Evaluation**: `cron-parser` (NPM) for parsing Cron strings to dates, or `rrule` for iCal-style recurrence rules.
* **Architecture Pattern**: Event-Driven. When an Asset's meter reading is updated in the API, emit an event (`AssetMeterUpdated`). The worker listens for this event and instantly checks if any `METER` triggers for that asset have been crossed, generating a WO in real-time rather than waiting for a nightly batch job.