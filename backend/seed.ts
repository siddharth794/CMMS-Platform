import bcrypt from 'bcryptjs';
import { Organization, Role, User, sequelize } from './src/models';

async function seed() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        // Force true only if you want to drop and recreate tables, let's keep it safe with alter: true or just rely on existing schema sync
        await sequelize.sync({ alter: true });

        // Check if DB already seeded
        const adminUserCount = await User.count();
        if (adminUserCount > 0) {
            console.log('Database already contains users. Skipping seed.');
            process.exit(0);
        }

        console.log('Seeding initial data...');

        // 1. Create Default Organization
        const org: any = await Organization.create({
            name: 'CMMS Demo Org',
            description: 'Default organization for CMMS Platform',
            address: '123 Tech Lane',
        });

        console.log(`Created Organization: ${org.name} (ID: ${org.id})`);

        // 2. Create Roles
        const roleData = [
            { name: "Super_Admin", description: "Full system access", permissions: { "all": { "read": true, "write": true } }, is_system_role: true },
            { name: "Org_Admin", description: "Organization administrator", permissions: { "all": { "read": true, "write": true } }, is_system_role: true },
            { name: "Facility_Manager", description: "Manages facilities and work orders", permissions: { "work_orders": { "read": true, "write": true }, "assets": { "read": true, "write": true }, "pm_schedules": { "read": true, "write": true }, "analytics": { "read": true } }, is_system_role: true },
            { name: "Technician", description: "Executes work orders", permissions: { "work_orders": { "read": true, "write": true }, "assets": { "read": true } }, is_system_role: true },
            { name: "Requestor", description: "Creates and tracks work orders", permissions: { "work_orders": { "read": true, "write": true }, "assets": { "read": true } }, is_system_role: true }
        ];

        let superAdminRole = null;
        for (const roleDef of roleData) {
            const role: any = await Role.create({ org_id: org.id, ...roleDef });
            if (role.name === "Super_Admin") {
                superAdminRole = role;
            }
        }

        console.log('Created standard roles.');

        // 3. Create Demo Users for Each Role
        console.log(`\nSeed Complete! Successfully created demo users.`);
        console.log(`-------------------------------------------------`);

        const demoUsersData = [
            { email: 'admin@demo.com', roleName: 'Super_Admin', username: 'admin', firstName: 'Admin', lastName: 'User', password: 'admin123' },
            { email: 'manager@demo.com', roleName: 'Facility_Manager', username: 'manager', firstName: 'Facility', lastName: 'Manager', password: 'manager123' },
            { email: 'tech@demo.com', roleName: 'Technician', username: 'tech', firstName: 'Tech', lastName: 'User', password: 'tech123' },
            { email: 'requestor@demo.com', roleName: 'Requestor', username: 'requestor', firstName: 'Staff', lastName: 'Requestor', password: 'requestor123' } // Added requestor for completeness
        ];

        for (const demoDef of demoUsersData) {
            // Find the actual role created from DB
            const role = await Role.findOne({ where: { name: demoDef.roleName, org_id: org.id } });
            if (!role) continue;

            const salt = bcrypt.genSaltSync(10);
            const passwordHash = bcrypt.hashSync(demoDef.password, salt);

            await User.create({
                org_id: org.id,
                role_id: role.id,
                email: demoDef.email,
                username: demoDef.username,
                first_name: demoDef.firstName,
                last_name: demoDef.lastName,
                password_hash: passwordHash,
                is_active: true
            });

            console.log(`Created User: ${demoDef.email} / ${demoDef.password} (Role: ${demoDef.roleName})`);
        }
        console.log(`-------------------------------------------------\n`);

        process.exit(0);

    } catch (error) {
        console.error('Unable to connect to the database or seed data:', error);
        process.exit(1);
    }
}

seed();
