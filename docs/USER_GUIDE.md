# Spartans FMS - RBAC User & Setup Guide

This guide explains how to properly initialize and manage the Role-Based Access Control (RBAC) system within Spartans FMS. The system relies on a specific hierarchy: **Accesses** (Features) -> **Roles** (Templates) -> **Groups** (Teams) -> **Users**.

## The Configuration Flow

To properly onboard a new Tenant (Organization) and set up their permissions, follow this sequence:

### 1. Define Accesses (Super Admins / Org Admins)
Accesses are the fundamental building blocks of permission. They represent distinct, granular actions a user can take in the system.

- Navigate to **Accesses** in the sidebar.
- Click **Add**.
- Create distinct feature strings. Use the format `module:action` for consistency.
  - *Examples*: `work_order:create`, `work_order:delete`, `inventory:adjust`, `asset:view`.
- **System vs. Custom**: Super Admins create "System" accesses available to all tenants. Org Admins can create "Custom" accesses specific to their own organization.

### 2. Create Roles (Org Admins)
Roles act as logical bundles of Accesses. Instead of assigning 20 features to a user manually, you assign them a Role.

- Navigate to **Roles** in the sidebar.
- Click **Add** to create a new Role (e.g., "Senior Technician", "Inventory Manager").
- Select the Role and use the **Access Mapping** section to check off which granular Accesses this role should include.
  - *Example*: The "Senior Technician" role might have `work_order:create`, `work_order:complete`, and `inventory:adjust`.

### 3. Create Groups (Org Admins) [Optional but Recommended]
Groups represent real-world teams, departments, or geographical locations (e.g., "Plumbing Team Alpha", "Downtown Facility Staff"). Groups allow you to assign Roles in bulk.

- Navigate to **Groups** in the sidebar.
- Click **Add** to create a new Group.
- Under the **Roles** tab of the Group, assign specific Roles to the Group.
  - *Example*: Give the "Plumbing Team Alpha" group the "Senior Technician" role.

### 4. Assign Users (Org Admins)
Finally, bind users to the access structure you've created.

- Navigate to **Users** in the sidebar.
- Select a User to view their details.
- **Method A (Direct Roles)**: Under the Roles tab, directly assign a Role to the user.
- **Method B (Group Membership)**: Under the Groups tab, add the user to a Group (e.g., "Plumbing Team Alpha").

> **Important Note on "Effective Access"**: A user automatically inherits all Accesses tied to Roles assigned directly to them **PLUS** any Accesses tied to Roles assigned to Groups they belong to. 

---

## Daily Operations & Self-Serve

### Viewing a User's Total Permissions
If you are unsure what a user can or cannot do, you do not need to manually calculate their group memberships.
1. Go to **Users**.
2. Select a User.
3. Check the **Effective Access** panel. This will display a flattened, comprehensive list of exactly what that user is permitted to do across the entire system.

### User Self-Service (Profile & Passwords)
Users do not need an administrator to update basic details or change their password.
1. The user clicks on **Settings** or **Profile** in the bottom-left of the sidebar.
2. They can update their `First Name`, `Last Name`, `Phone`, and `Username`.
3. In the **Change Password** section, they must provide their `Current Password` to authorize setting a new password. The system verifies this securely against the database hash before applying the change.
