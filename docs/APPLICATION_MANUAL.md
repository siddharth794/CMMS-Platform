# Spartans FMS - Application & Administrator Manual

Welcome to the Spartans Facility Management System (FMS). This manual provides a comprehensive guide on how to navigate, configure, and operate the platform. It specifically details the powerful **Role-Based Access Control (RBAC)** engine that drives user permissions and tenant security.

---

## 1. Understanding the RBAC Engine

The system uses a highly granular, multi-tenant RBAC architecture. Permissions are built from the ground up using four core components:

1. **Accesses (Features)**: The smallest unit of permission. Represented by feature strings (e.g., `work_order:create`, `asset:view`).
2. **Roles (Templates)**: A logical bundle of Accesses. For example, a "Senior Technician" role might contain 15 different access features.
3. **Groups (Teams)**: A collection of users (e.g., "Plumbing Team Alpha"). Groups can be assigned Roles, granting all members of the group those permissions.
4. **Users**: The actual people logging in. Users can be assigned Roles directly, or inherit them by being placed into Groups.

### The "Effective Access" Concept
When a user logs in, the system automatically calculates their **Effective Access**. This is a flattened combination of:
* Permissions from Roles assigned **directly** to the user.
* Permissions from Roles assigned to **Groups** the user belongs to.

*You can view a user's absolute Effective Access at any time from the User Details page.*

---

## 2. Initial Setup & Onboarding (Admin Guide)

When onboarding a new Tenant (Organization), the Org Admin should follow this specific flow to configure the workspace:

### Step 1: Review/Define Accesses
* **Navigation:** `Sidebar -> Accesses` *(Super Admin Only)*
* Super Admins create "System" accesses that are available to all tenants. 
* *Note:* Org Admins can also create custom accesses specifically for their own organization if unique tracking is required.

### Step 2: Create Roles
* **Navigation:** `Sidebar -> Roles`
* Click **Add** to create custom roles tailored to your organization (e.g., "Night Shift Manager", "Inventory Clerk").
* You will be prompted to select which Access Features belong to this new Role.

### Step 3: Create User Groups
* **Navigation:** `Sidebar -> Groups`
* Create functional groups representing your real-world teams (e.g., "Electrical Team", "North Campus Staff").
* Under the **Roles** tab of the group, assign the relevant Roles (e.g., assign the "Technician" role to the "Electrical Team").

### Step 4: Add & Assign Users
* **Navigation:** `Sidebar -> Users`
* Invite new users to your organization.
* You can manage their permissions via two methods:
  1. **Direct Assignment:** Add a Role directly to their profile.
  2. **Group Assignment:** Add them to a Group (they will instantly inherit the Group's roles).

---

## 3. Daily Operations (User Guide)

### Self-Service Profile & Security
Users no longer need an administrator to manage their basic details.
* **Navigation:** Click on `Profile` or `Settings` in the bottom-left corner.
* **Update Details:** Change First Name, Last Name, Username, and Phone Number.
* **Change Password:** Securely update passwords by verifying the current password first.

### Managing Assets
The Assets module tracks all physical equipment and infrastructure.
* **Viewing:** The Asset list displays Name, Asset Tag, Category, and Location. 
* **Creating/Editing:** Clicking "New Asset" or selecting an existing asset opens a full-page, expanded form. 
* **Details:** The form includes a structured Category dropdown, a calendar DatePicker for Purchase Dates, and monetary fields localized in Rupees (₹).
* *Safety feature:* The destructive "Delete Asset" button is intentionally separated from the "Save Changes" button to prevent accidental data loss.

### Managing Inventory
The Inventory module tracks consumable parts and supplies used in Work Orders.
* **Tracking:** Items are tracked by SKU, Category, and Storage Location.
* **Financials:** Unit Costs and Total Value calculations are automatically displayed in Rupees (₹).
* **Alerts:** Items falling below their designated `Min Qty` will trigger "Low Stock" UI indicators.

### Work Orders (Core Workflow)
Work Orders tie Users, Assets, and Inventory together.
* **Creation:** A Requester or Manager creates a Work Order against a specific Asset.
* **Assignment:** Managers can assign Work Orders specifically to users who possess `technician` or `facility_manager` roles.
* **Execution:** Technicians execute the work. They can log comments, upload photo attachments, and deduct consumable items directly from the Inventory. 
* **Real-time:** Updates and comments on a Work Order are broadcasted in real-time to all users currently viewing that Work Order via WebSockets.

---

## 4. Developer Notes

For engineers maintaining the platform:
* **UI Layouts:** Detail pages (Asset, Inventory) utilize a responsive CSS Grid (`grid-cols-1 md:grid-cols-4`) to ensure wide, breathable forms on desktop while collapsing cleanly on mobile.
* **API Security:** Endpoints are protected by two primary middlewares:
  * `requireRole(['manager'])` - Legacy broad check.
  * `requirePermission('inventory:edit')` - New, highly granular RBAC check evaluated against the user's computed `effectiveAccesses` array.
* **Database Boundaries:** All Tenant API queries automatically inject `where: { org_id: req.user.org_id }` at the Repository layer to guarantee absolute data isolation between organizations.
