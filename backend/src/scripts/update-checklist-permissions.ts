import { Role, Access, sequelize } from '../models';
import { PERMISSIONS, DEFAULT_ROLE_PERMISSIONS } from '../constants/permissions';

async function updateChecklistPermissions() {
    try {
        await sequelize.authenticate();
        console.log('Connected to database.');

        // 1. Create the new checklist permissions if they don't exist
        const checklistPermissions = PERMISSIONS.filter(p => p.module === 'Checklists');
        
        for (const perm of checklistPermissions) {
            const [access, created] = await Access.findOrCreate({
                where: { name: perm.name },
                defaults: { ...perm, is_system: true, org_id: null }
            });
            console.log(`${created ? 'Created' : 'Already exists'}: Permission "${perm.name}"`);
        }

        // 2. Update roles with checklist permissions
        const rolesToUpdate = ['Org_Admin', 'Facility_Manager'];
        
        for (const roleName of rolesToUpdate) {
            const role: any = await Role.findOne({ 
                where: { name: roleName, is_system_role: true } 
            });
            
            if (!role) {
                console.log(`Role "${roleName}" not found, skipping.`);
                continue;
            }

            const allowedPerms = DEFAULT_ROLE_PERMISSIONS[roleName] || [];
            const checklistAccesses = await Access.findAll({ 
                where: { 
                    name: ['checklist:manage', 'checklist:execute'],
                    is_system: true 
                } 
            });

            // Check current accesses
            const currentAccesses = await role.getAccesses();
            const currentAccessNames = currentAccesses.map((a: any) => a.name);
            
            for (const access of checklistAccesses) {
                if (!currentAccessNames.includes(access.name) && allowedPerms.includes(access.name)) {
                    await role.addAccess(access);
                    console.log(`Added "${access.name}" to role "${roleName}"`);
                } else if (currentAccessNames.includes(access.name)) {
                    console.log(`Role "${roleName}" already has "${access.name}"`);
                }
            }
        }

        // 3. Update Technician and Requestor with execute permission only
        const executeOnlyRoles = ['Technician', 'Requestor'];
        
        for (const roleName of executeOnlyRoles) {
            const role: any = await Role.findOne({ 
                where: { name: roleName, is_system_role: true } 
            });
            
            if (!role) continue;

            const executeAccess = await Access.findOne({ 
                where: { name: 'checklist:execute', is_system: true } 
            });

            if (executeAccess) {
                const currentAccesses = await role.getAccesses();
                const hasExecute = currentAccesses.some((a: any) => a.name === 'checklist:execute');
                
                if (!hasExecute) {
                    await role.addAccess(executeAccess);
                    console.log(`Added "checklist:execute" to role "${roleName}"`);
                } else {
                    console.log(`Role "${roleName}" already has "checklist:execute"`);
                }
            }
        }

        console.log('\nDone! Checklist permissions have been updated.');
        process.exit(0);

    } catch (error) {
        console.error('Error updating permissions:', error);
        process.exit(1);
    }
}

updateChecklistPermissions();
