import bcrypt from 'bcryptjs';
import { Organization, Role, User, Access, sequelize } from '../models';
import { PERMISSIONS, DEFAULT_ROLE_PERMISSIONS } from '../constants/permissions';

async function seed() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

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

        const orgId = org.id || org.dataValues.id;
        console.log(`Organization: ${org.name || org.dataValues.name} (ID: ${orgId})`);

        // 2. Create Accesses (Permissions)
        for (const perm of PERMISSIONS) {
            const [access, created] = await Access.findOrCreate({
                where: { name: perm.name },
                defaults: { ...perm, is_system: true, org_id: null }
            });
            if (!created && !access.is_system) {
                await access.update({ is_system: true });
            }
        }
        console.log('System Accesses (Permissions) ready.');

        // 3. Create Roles and associate default Accesses
        const roleData = [
            { name: "Super_Admin", description: "Full system access", is_system_role: true },
            { name: "Org_Admin", description: "Organization administrator", is_system_role: true },
            { name: "Facility_Manager", description: "Manages facilities and work orders", is_system_role: true },
            { name: "Technician", description: "Executes work orders", is_system_role: true },
            { name: "Requestor", description: "Creates and tracks work orders", is_system_role: true },
            { name: "Cleaning_Staff", description: "Executes area-based checklists", is_system_role: true }
        ];

        for (const roleDef of roleData) {
            console.log(`Ensuring role exists: ${roleDef.name}`);
            const [role] = await Role.findOrCreate({
                where: { name: roleDef.name, org_id: orgId },
                defaults: {
                    name: roleDef.name,
                    org_id: orgId,
                    is_system_role: roleDef.is_system_role,
                    description: roleDef.description
                }
            }).catch(e => {
                console.error(`Error ensuring role ${roleDef.name}:`, e);
                throw e;
            });
            
            // Map permissions to role
            const allowedPerms = DEFAULT_ROLE_PERMISSIONS[role.name as keyof typeof DEFAULT_ROLE_PERMISSIONS] || [];
            
            if (allowedPerms.includes('*')) {
                // Give Super Admin all system permissions
                const allAccesses = await Access.findAll({ where: { is_system: true } });
                await (role as any).setAccesses(allAccesses);
            } else if (allowedPerms.length > 0) {
                // Give specific permissions
                const specificAccesses = await Access.findAll({ where: { name: allowedPerms, is_system: true } });
                await (role as any).setAccesses(specificAccesses);
            }
        }

        console.log('Roles ready.');

        // 4. Create Demo Users (find or create each)
        const demoUsersData = [
            { email: 'admin@demo.com', roleName: 'Super_Admin', username: 'admin', firstName: 'Admin', lastName: 'User', password: 'admin123' },
            { email: 'orgadmin@demo.com', roleName: 'Org_Admin', username: 'orgadmin', firstName: 'Org', lastName: 'Admin', password: 'orgadmin123' },
            { email: 'manager@demo.com', roleName: 'Facility_Manager', username: 'manager', firstName: 'Facility', lastName: 'Manager', password: 'manager123' },
            { email: 'tech@demo.com', roleName: 'Technician', username: 'tech', firstName: 'Tech', lastName: 'User', password: 'tech123' },
            { email: 'requestor@demo.com', roleName: 'Requestor', username: 'requestor', firstName: 'Staff', lastName: 'Requestor', password: 'requestor123' },
            { email: 'cleaner@demo.com', roleName: 'Cleaning_Staff', username: 'cleaner', firstName: 'Demo', lastName: 'Cleaner', password: 'cleaner123' },
        ];

        console.log(`\nSeed Complete! Demo users:`);
        console.log(`-------------------------------------------------`);

        for (const demoDef of demoUsersData) {
            const role: any = await Role.findOne({ where: { name: demoDef.roleName, is_system_role: true } });
            if (!role) continue;

            const salt = bcrypt.genSaltSync(10);
            const passwordHash = bcrypt.hashSync(demoDef.password, salt);

            const [user, created]: any = await User.findOrCreate({
                where: { email: demoDef.email },
                defaults: {
                    org_id: orgId,
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
