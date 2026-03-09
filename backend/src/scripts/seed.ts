import bcrypt from 'bcryptjs';
import { Organization, Role, User, sequelize } from '../models';

async function seed() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        // Force true only if you want to drop and recreate tables, let's keep it safe with alter: true or just rely on existing schema sync
        await sequelize.sync();

        console.log('Seeding initial data...');

        // 1. Find or Create Default Organization
        const [org]: any = await Organization.findOrCreate({
            where: { name: 'CMMS Demo Org' },
            defaults: {
                description: 'Default organization for CMMS Platform',
                address: '123 Tech Lane',
                owner_name: 'John Doe',
                website_url: 'https://demo-corp.com'
            }
        });

        console.log(`Organization: ${org.name} (ID: ${org.id})`);

        // 2. Create Roles (find or create each)
        const roleData = [
            { name: "Super_Admin", description: "Full system access", is_system_role: true },
            { name: "Org_Admin", description: "Organization administrator", is_system_role: true },
            { name: "Facility_Manager", description: "Manages facilities and work orders", is_system_role: true },
            { name: "Technician", description: "Executes work orders", is_system_role: true },
            { name: "Requestor", description: "Creates and tracks work orders", is_system_role: true }
        ];

        for (const roleDef of roleData) {
            await Role.findOrCreate({
                where: { name: roleDef.name, org_id: org.id },
                defaults: { org_id: org.id, ...roleDef }
            });
        }

        console.log('Roles ready.');

        // 3. Create Demo Users (find or create each)
        const demoUsersData = [
            { email: 'admin@demo.com', roleName: 'Super_Admin', username: 'admin', firstName: 'Admin', lastName: 'User', password: 'admin123' },
            { email: 'orgadmin@demo.com', roleName: 'Org_Admin', username: 'orgadmin', firstName: 'Org', lastName: 'Admin', password: 'orgadmin123' },
            { email: 'manager@demo.com', roleName: 'Facility_Manager', username: 'manager', firstName: 'Facility', lastName: 'Manager', password: 'manager123' },
            { email: 'tech@demo.com', roleName: 'Technician', username: 'tech', firstName: 'Tech', lastName: 'User', password: 'tech123' },
            { email: 'requestor@demo.com', roleName: 'Requestor', username: 'requestor', firstName: 'Staff', lastName: 'Requestor', password: 'requestor123' },
        ];

        console.log(`\nSeed Complete! Demo users:`);
        console.log(`-------------------------------------------------`);

        for (const demoDef of demoUsersData) {
            const role: any = await Role.findOne({ where: { name: demoDef.roleName, org_id: org.id } });
            if (!role) continue;

            const salt = bcrypt.genSaltSync(10);
            const passwordHash = bcrypt.hashSync(demoDef.password, salt);

            const [user, created]: any = await User.findOrCreate({
                where: { email: demoDef.email },
                defaults: {
                    org_id: org.id,
                    username: demoDef.username,
                    first_name: demoDef.firstName,
                    last_name: demoDef.lastName,
                    password_hash: passwordHash,
                    is_active: true
                }
            });

            if (created) {
                await user.addRole(role);
            }

            console.log(`${created ? 'Created' : 'Already exists'}: ${demoDef.email} / ${demoDef.password} (Role: ${demoDef.roleName})`);
        }
        console.log(`-------------------------------------------------\n`);

        process.exit(0);

    } catch (error) {
        console.error('Unable to connect to the database or seed data:', error);
        process.exit(1);
    }
}

seed();
