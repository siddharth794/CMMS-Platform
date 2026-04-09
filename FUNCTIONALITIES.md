# CMMS Platform - Functionalities & User Manual

Welcome to the comprehensive guide for the CMMS Platform. This document explains how the application works, the core concepts, and the standard operating procedures.

---

## 1. Application Modules

### 📦 Asset Management
Track all your equipment, machinery, and infrastructure in one place.
- **Classification**: Assets are categorized as *Movable* or *Immovable*.
- **Details**: Track serial numbers, purchase dates, warranty info, and manufacturer details.
- **Location Mapping**: Assign assets to specific sites, floors, and areas.

### 🛠️ Work Order Lifecycle
The system follows a **Strict State Machine** to ensure accountability.

| Status | Meaning | Action |
| :--- | :--- | :--- |
| **New** | Request submitted. | Awaiting assignment. |
| **Open** | Manager assigned a tech. | Ready to start. |
| **In Progress** | Technician started work. | Active execution. |
| **On Hold** | Blocked (e.g., waiting for parts). | Brief pause. |
| **Pending Review** | Technician finished work. | Awaiting Manager approval. |
| **Completed** | Manager approved the work. | Finalized. |

> [!IMPORTANT]
> **Strict Validation**: Technicians must provide "Resolution Notes" to submit for review. If the priority is High/Critical, an image attachment is mandatory.

### 🕒 Preventive Maintenance (PM)
Automate your recurring maintenance tasks.
- **Schedules**: Define fixed or floating logic for PM tasks.
- **Automatic Generation**: Work orders are automatically generated when a PM schedule is triggered.

### 📋 Checklist Engine
Enhance work quality with structured checklists.
- **Work Order Checklists**: Specific tasks to be completed for a job.
- **Area Checklists**: Routine inspections for physical spaces (e.g., Washroom cleaning).
- **QR Verification**: Staff can scan QR codes at physical locations to unlock and verify area checklists.

### 🏢 Multi-Tenancy & My Site
- **Organizations**: Absolute data isolation between different companies.
- **My Site**: A dedicated dashboard for Facility Managers to view their assigned site, manage floors/areas, and track their local team.

---

## 2. Administrator Guide (RBAC)

The system uses a flexible **Role-Based Access Control** engine.

### Building Blocks of Power:
1.  **Accesses**: Individual "Keys" (e.g., *Create Asset*).
2.  **Roles**: "Keychains" grouping several accesses (e.g., *Technician*).
3.  **Groups**: "Departments" grouping users.
4.  **Users**: The individuals who inherit permissions from Roles or Groups.

### Best Practices:
-   **Use Groups**: Instead of assigning roles one-by-one, assign users to a "Plumbing Group" that already has the "Technician" role.
-   **Security**: Limit "Super Admin" access to a very small number of users. Use "Org Admin" for general management.

---

## 3. Maintenance Guide (Hinglish)

### Work Order Lifecycle (Simplified)
-   **New → Open**: Jab Manager assign karega.
-   **Open → In Progress**: Jab Tech site par kaam shuru karega.
-   **In Progress → Pending Review**: Tech ko batana hoga usne kya theek kiya (Notes) aur agar zaroori ho toh photo dalni hogi.
-   **Pending Review → Completed**: Manager check karke approve karega.

### Rules System
1.  **Sequence Lock**: Jump nahi kar sakte statuses.
2.  **Manager Approval**: Sirf Manager hi kaam ko final `Completed` mark kar sakta hai.
3.  **Audit Trail**: Kaun kab aur kya badal raha hai, system sab record karta hai.

---

## 4. Analytics & Insights
-   **Manager Dashboard**: High-level overview of work order distribution, completion rates, and asset health.
-   **Technician Dashboard**: Focused view of assigned tasks, priorities, and upcoming deadlines.
