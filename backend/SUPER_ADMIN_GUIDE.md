# CMMS Super Admin Guide: Managing Users, Roles, and Access

Welcome to the **CMMS User Management Guide**. As a Super Admin, you have full control over who can access your organization's data and exactly what actions they can perform. 

This guide is written in plain English to help you understand how to securely and efficiently manage your team's access to the platform.

---

## 1. The Core Concepts (The Building Blocks)

To make managing hundreds of employees easy, our system is broken down into four simple building blocks. 

Think of it like securing a physical office building:

* **Accesses (The Keys):** These are individual, specific permissions. For example, "Create Work Order", "Delete Asset", or "View Inventory". 
* **Roles (The Keychains):** You rarely hand out individual keys. Instead, you group them onto a keychain. A **Role** (like *Technician* or *Manager*) is just a collection of Accesses.
* **Groups (The Departments):** These are teams of people, like *The Night Shift* or *Plumbing Department*. 
* **Users (The Employees):** The actual people logging into the system using their email and password.

### How it all connects:
Instead of manually picking 50 specific permissions for every new employee, you simply:
1. Create a **Role** (e.g., "Maintenance Worker") and give it the right permissions.
2. Create a **Group** (e.g., "Plumbing Team") and assign the "Maintenance Worker" role to this group.
3. Add a **User** (e.g., John Doe) to the "Plumbing Team" group.

*Result:* John Doe automatically gets all the permissions of a Maintenance Worker!

---

## 2. Step-by-Step Management Guide

### A. Managing Roles
Roles define **what** a person can do in the system. When your organization was created, we automatically generated standard roles for you (*Super Admin, Org Admin, Facility Manager, Technician, Requestor*). 

**To create a custom Role:**
1. Navigate to the **Roles** section in your admin dashboard.
2. Click **Create New Role**.
3. Name the role (e.g., "Junior Inventory Clerk").
4. Scroll through the list of **Accesses** (permissions) and check the boxes for the exact actions this role should be allowed to do (e.g., *View Inventory*, *Edit Inventory*).
5. Save the role.

### B. Managing Groups
Groups define **teams**. They make onboarding new employees incredibly fast.

**To create a Group:**
1. Navigate to the **Groups** section.
2. Click **Create New Group**.
3. Name the group (e.g., "Electrical Team - Building A").
4. **Assign Roles:** Select which roles this whole team should have (e.g., *Technician*).
5. Save the group. 

*Note: Any user you add to this group in the future will automatically inherit the "Technician" role.*

### C. Managing Users
This is where you invite your actual staff to use the software.

**To add a new User:**
1. Navigate to the **Users** section.
2. Click **Add User**.
3. Enter their basic details (First Name, Last Name, Email, Password).
4. **Assign to Groups (Recommended):** Select the groups they belong to (e.g., "Electrical Team"). This automatically gives them all the roles tied to that group.
5. **Assign Direct Roles (Optional):** If this specific person needs an extra role that the rest of their team doesn't have, you can assign it directly to them here.
6. Save the user. They can now log in!

**To deactivate a User:**
If an employee leaves the company, simply edit their User profile and set their status to **Inactive**. This immediately prevents them from logging in, while keeping all their past work order history intact for your records.

---

## 3. Best Practices for Super Admins

To keep your system clean and easy to manage, we highly recommend following these rules of thumb:

✅ **DO use Groups as much as possible.** 
If you hire 10 new technicians, it is much faster to drop them all into a "Technician Group" than to manually assign the "Technician Role" to each person one-by-one.

✅ **DO NOT give out "Super Admin" lightly.** 
Super Admins can delete assets, change system settings, and remove other users. Only give this role to trusted IT or high-level operational managers. Use the "Org Admin" or "Facility Manager" roles for daily management.

✅ **DO use "Requestor" for standard staff.**
If you have employees who just need to submit broken equipment tickets (but shouldn't be actually fixing them or managing inventory), assign them the "Requestor" role.

✅ **DO NOT delete users.**
Always choose to "Deactivate" them instead. Deleting a user might cause confusion when reviewing work orders from 6 months ago that they completed. Deactivating them keeps your historical records perfect.

---

## 4. Real-World Examples & Scenarios

Here are a few common situations you might face, and the best way to handle them in the system.

### Scenario A: Hiring a New Technician
**The Situation:** You just hired Sarah as a new maintenance technician.
**The Solution:**
1. You navigate to **Users** and click **Add User**.
2. You fill out Sarah's name, email, and password.
3. Instead of scrolling through roles, you simply click the "Groups" dropdown and select the **"Maintenance Team"** group.
4. You click Save. 
**Result:** Because the "Maintenance Team" group already has the *Technician* role attached to it, Sarah instantly gets all the correct permissions to see and close work orders.

### Scenario B: Setting Up a Read-Only Auditor
**The Situation:** A health and safety inspector (or external auditor) is coming next week. They need to see your assets, PM schedules, and work order history, but you definitely don't want them editing or deleting anything.
**The Solution:**
1. Navigate to **Roles** and click **Create New Role**. Name it `"External Auditor"`.
2. Scroll through the Accesses (Permissions) checklist. **Only** check the "View" boxes (e.g., *View Work Orders*, *View Assets*, *View Inventory*). Do not check any "Create", "Edit", or "Delete" boxes. Save the Role.
3. Navigate to **Users** and create a user account for "Inspector Bob".
4. Do not put Bob in any groups. Instead, assign him the **"External Auditor"** role directly.
**Result:** Bob can safely log in, click around, and read data without the ability to accidentally break anything.

### Scenario C: Promoting a Technician to Shift Supervisor
**The Situation:** Mike is a great Technician. You just promoted him to Shift Supervisor. He still needs to do technician work (fixing things), but now he also needs the ability to assign new work orders to other staff members and manage inventory stock.
**The Solution:**
1. First, navigate to **Roles** and create a new role called `"Shift Supervisor"`. Give this role the specific extra permissions Mike needs (e.g., *Assign Work Orders*, *Edit Inventory*).
2. Navigate to **Users** and edit Mike's profile.
3. Leave Mike in the **"Maintenance Team"** group (so he doesn't lose his basic Technician abilities).
4. Under the "Direct Roles" section, add your new `"Shift Supervisor"` role.
**Result:** The system "stacks" Mike's permissions. He has his basic Technician permissions from his group, *plus* his new Dispatcher/Inventory permissions from his direct role.

### Scenario D: An Employee Leaves the Company
**The Situation:** John Doe resigned and his last day is today.
**The Solution:**
1. Navigate to **Users** and search for John Doe.
2. Edit his profile.
3. Find the "Status" toggle and switch it from **Active** to **Inactive**.
4. Save the user.
**Result:** John can no longer log in. However, when you run a report next year on "Who completed the plumbing work order in Building B?", John's name will still show up perfectly.

---

## 5. Frequently Asked Questions (FAQ)

**What happens if a user is in two different groups?**
The system is smart! It combines their permissions. If Group A gives them permission to *Edit Assets*, and Group B gives them permission to *Create Work Orders*, the user will be able to do **both**.

**Can I change a standard role like "Technician"?**
Yes. You can edit the "Technician" role and add or remove Accesses (permissions) at any time. When you hit save, every Technician in your organization will instantly have their permissions updated.

**I assigned a user to a group, but they say they can't access a page?**
Double-check the Group's settings to ensure the correct Role is attached to the Group. Then, check that Role's settings to ensure the specific Access (Permission) box is checked.